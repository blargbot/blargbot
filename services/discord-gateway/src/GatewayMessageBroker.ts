import { createHash, randomUUID } from 'node:crypto';

import type { DiscordGatewayMessage } from '@blargbot/discord-gateway-client';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type { ConsumeMessage, MessageHandle, MessageHub } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob } from '@blargbot/message-hub';
import type * as discordeno from 'discordeno';

export class GatewayMessageBroker {
    static readonly #baseName = 'discord-gateway' as const;
    static readonly #commandsName = `${this.#baseName}-command` as const;
    static readonly #requestsName = `${this.#baseName}-requests` as const;
    static readonly #eventsDedupeName = `${DiscordGatewayMessageBroker.eventExchange[0]}-dedupe` as const;

    readonly #messages: MessageHub;
    public readonly managerId: string;

    public constructor(messages: MessageHub, options: GatewayMessageBrokerOptions) {
        this.#messages = messages;
        this.managerId = options.managerId;

        this.#messages.onConnected(async c => {
            await Promise.all([
                c.assertExchange(GatewayMessageBroker.#commandsName, 'topic', { durable: true }),
                c.assertExchange(GatewayMessageBroker.#requestsName, 'topic', { durable: true }),
                c.assertExchange(...DiscordGatewayMessageBroker.eventExchange),
                c.assertExchange(GatewayMessageBroker.#eventsDedupeName, 'x-message-deduplication', {
                    durable: true,
                    arguments: {
                        'x-cache-size': 1000,
                        'x-cache-ttl': 500
                    }
                })
            ]);
            await c.bindExchange(DiscordGatewayMessageBroker.eventExchange[0], GatewayMessageBroker.#eventsDedupeName, '#');
        });
    }

    public async sendWorkerCommand<Type extends keyof WorkerMessageTypes>(type: Type, workerId: number, message: WorkerMessageTypes[Type]): Promise<void> {
        await this.#messages.publish(GatewayMessageBroker.#commandsName, `${this.managerId}.worker.${workerId}.${type}`, jsonToBlob(message));
    }

    public async sendManagerCommand<Type extends keyof ManagerMessageTypes>(type: Type, message: ManagerMessageTypes[Type]): Promise<void> {
        await this.#messages.publish(GatewayMessageBroker.#commandsName, `${this.managerId}.manager.${type}`, jsonToBlob(message));
    }

    public async sendGatewayEvent(shardId: number, lastShardId: number, event: discordeno.DiscordGatewayPayload): Promise<void> {
        const message: DiscordGatewayMessage<discordeno.DiscordGatewayPayload> = {
            lastShard: lastShardId,
            payload: event,
            shard: shardId
        };
        await this.#messages.publish(GatewayMessageBroker.#eventsDedupeName, `${shardId}/${lastShardId}.${event.op}.${event.t ?? '-'}`, jsonToBlob(message), {
            headers: {
                'x-deduplication-header': createHash('md5').update(JSON.stringify(event.d)).digest('hex')
            }
        });
    }

    public async handleWorkerCommand<Type extends keyof WorkerMessageTypes>(type: Type, workerId: number | '*', handler: (message: WorkerMessageTypes[Type], msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: GatewayMessageBroker.#commandsName,
            queue: `${GatewayMessageBroker.#commandsName}-${type}-${randomUUID()}`,
            queueArgs: { autoDelete: true },
            filter: `${this.managerId}.worker.${workerId}.${type}`,
            async handle(data, msg) {
                await handler(await blobToJson(data), msg);
            },
            consumeArgs: { noAck: true }
        });
    }

    public async handleManagerCommand<Type extends keyof ManagerMessageTypes>(type: Type, handler: (message: ManagerMessageTypes[Type], msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: GatewayMessageBroker.#commandsName,
            queue: `${GatewayMessageBroker.#commandsName}-manager-${type}-${randomUUID()}`,
            queueArgs: { autoDelete: true },
            filter: `${this.managerId}.manager.${type}`,
            async handle(data, msg) {
                await handler(await blobToJson(data), msg);
            },
            consumeArgs: { noAck: true }
        });
    }

    public async handleGatewayRequest(shardId: number, lastShardId: number, handler: (message: discordeno.ShardSocketRequest, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: GatewayMessageBroker.#requestsName,
            queue: `${GatewayMessageBroker.#requestsName}-${shardId}-${lastShardId}`,
            queueArgs: { autoDelete: true },
            filter: `${shardId}/${lastShardId}`,
            async handle(data, msg) {
                await handler(await blobToJson(data), msg);
            },
            consumeArgs: { noAck: true }
        });
    }
}

export interface GatewayMessageBrokerOptions {
    readonly managerId: string;
}

export type WorkerMessageTypes = {
    identifyShard: { shardId: number; };
    allowIdentify: { shardId: number; };
}

export type ManagerMessageTypes = {
    requestIdentify: { workerId: number; shardId: number; };
}

import { randomUUID } from 'node:crypto';

import type { MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import type * as discordeno from 'discordeno';

export class GatewayMessageBroker extends MessageBroker {
    static readonly #baseName = 'discord-gateway' as const;
    static readonly #commandsName = `${this.#baseName}-command` as const;
    static readonly #requestsName = `${this.#baseName}-requests` as const;
    static readonly #eventsName = `${this.#baseName}-events` as const;
    static readonly #eventsDedupeName = `${this.#eventsName}-dedupe` as const;

    public readonly managerId: string;

    public constructor(options: GatewayMessageBrokerOptions) {
        super(options);
        this.managerId = options.managerId;
    }

    public override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await Promise.all([
            channel.assertExchange(GatewayMessageBroker.#commandsName, 'topic', { durable: true }),
            channel.assertExchange(GatewayMessageBroker.#requestsName, 'topic', { durable: true }),
            channel.assertExchange(GatewayMessageBroker.#eventsName, 'topic', { durable: true }),
            channel.assertExchange(GatewayMessageBroker.#eventsDedupeName, 'x-message-deduplication', {
                durable: true,
                arguments: {
                    'x-cache-size': 1000,
                    'x-cache-ttl': 500
                }
            })
        ]);
        await channel.bindExchange(GatewayMessageBroker.#eventsName, GatewayMessageBroker.#eventsDedupeName, '#');
    }

    public async sendWorkerCommand<Type extends keyof WorkerMessageTypes>(type: Type, workerId: number, message: WorkerMessageTypes[Type]): Promise<void> {
        await this.sendMessage(GatewayMessageBroker.#commandsName, `${this.managerId}.worker.${workerId}.${type}`, this.jsonToBlob(message));
    }

    public async sendManagerCommand<Type extends keyof ManagerMessageTypes>(type: Type, message: ManagerMessageTypes[Type]): Promise<void> {
        await this.sendMessage(GatewayMessageBroker.#commandsName, `${this.managerId}.manager.${type}`, this.jsonToBlob(message));
    }

    public async sendGatewayEvent(shardId: number, lastShardId: number, event: discordeno.DiscordGatewayPayload): Promise<void> {
        await this.sendMessage(GatewayMessageBroker.#eventsDedupeName, `${shardId}/${lastShardId}.${event.op}.${event.t ?? '-'}`, this.jsonToBlob({ shardId, lastShardId, event }));
    }

    public async handleWorkerCommand<Type extends keyof WorkerMessageTypes>(type: Type, workerId: number | '*', handler: (message: WorkerMessageTypes[Type]) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: GatewayMessageBroker.#commandsName,
            queue: `${GatewayMessageBroker.#commandsName}-${type}-${randomUUID()}`,
            queueArgs: { autoDelete: true },
            filter: `${this.managerId}.worker.${workerId}.${type}`,
            async handle(data) {
                await handler(await this.blobToJson(data));
            },
            consumeArgs: { noAck: true }
        });
    }

    public async handleManagerCommand<Type extends keyof ManagerMessageTypes>(type: Type, handler: (message: ManagerMessageTypes[Type]) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: GatewayMessageBroker.#commandsName,
            queue: `${GatewayMessageBroker.#commandsName}-manager-${type}-${randomUUID()}`,
            queueArgs: { autoDelete: true },
            filter: `${this.managerId}.manager.${type}`,
            async handle(data) {
                await handler(await this.blobToJson(data));
            },
            consumeArgs: { noAck: true }
        });
    }

    public async handleGatewayRequest(shardId: number, lastShardId: number, handler: (message: discordeno.ShardSocketRequest) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: GatewayMessageBroker.#requestsName,
            queue: `${GatewayMessageBroker.#requestsName}-${shardId}-${lastShardId}`,
            queueArgs: { autoDelete: true },
            filter: `${shardId}/${lastShardId}`,
            async handle(data) {
                await handler(await this.blobToJson(data));
            },
            consumeArgs: { noAck: true }
        });
    }
}

export interface GatewayMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
    readonly managerId: string;
}

export type WorkerMessageTypes = {
    identifyShard: { shardId: number; };
    allowIdentify: { shardId: number; };
}

export type ManagerMessageTypes = {
    requestIdentify: { workerId: number; shardId: number; };
}

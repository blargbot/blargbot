import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

const ipcExchange = 'discord-gateway-command';
export class DiscordGatewayIPCMessageBroker {
    readonly #messages: MessageHub;
    public readonly managerId: string;

    public constructor(messages: MessageHub, options: GatewayMessageBrokerOptions) {
        this.#messages = messages;
        this.managerId = options.managerId;

        this.#messages.onConnected(c => c.assertExchange(ipcExchange, 'topic', { durable: true }));
    }

    public async sendWorkerCommand<Type extends keyof WorkerMessageTypes>(type: Type, workerId: number, message: WorkerMessageTypes[Type]): Promise<void> {
        await this.#messages.publish(ipcExchange, `${this.managerId}.worker.${workerId}.${type}`, await jsonToBlob(message));
    }

    public async sendManagerCommand<Type extends keyof ManagerMessageTypes>(type: Type, message: ManagerMessageTypes[Type]): Promise<void> {
        await this.#messages.publish(ipcExchange, `${this.managerId}.manager.${type}`, await jsonToBlob(message));
    }

    public async handleWorkerCommand<Type extends keyof WorkerMessageTypes>(type: Type, workerId: number | '*', handler: (message: WorkerMessageTypes[Type], msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: ipcExchange,
            queue: MessageHub.makeQueueName('discord-gateway-worker', type, `${this.managerId}_${workerId}`),
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
            exchange: ipcExchange,
            queue: MessageHub.makeQueueName('discord-gateway-manager', type, this.managerId),
            queueArgs: { autoDelete: true },
            filter: `${this.managerId}.manager.${type}`,
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

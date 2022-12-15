import amqplib from 'amqplib';
import { randomUUID } from 'crypto';
import type * as discordeno from 'discordeno';

export class GatewayMessageBroker {
    static readonly #baseName = 'discord-gateway' as const;
    static readonly #commandsName = `${this.#baseName}-command` as const;
    static readonly #requestsName = `${this.#baseName}-requests` as const;
    static readonly #eventsName = `${this.#baseName}-events` as const;
    static readonly #eventsDedupeName = `${this.#eventsName}-dedupe` as const;

    readonly #options: GatewayMessageBrokerOptions;
    #connected?: Promise<amqplib.Channel>;

    public get managerId(): string {
        return this.#options.managerId;
    }

    public constructor(options: GatewayMessageBrokerOptions) {
        this.#options = options;
    }

    async #getChannel(): Promise<amqplib.Channel> {
        if (this.#connected === undefined)
            throw new Error('Not connected');
        return await this.#connected;
    }

    async #connect(): Promise<amqplib.Channel> {
        try {
            const connection = await amqplib.connect({
                hostname: this.#options.host,
                password: this.#options.password,
                username: this.#options.username
            });
            connection.once('close', () => void this.#reconnect());
            const channel = await connection.createChannel();
            channel.once('close', () => void connection.close());

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

            return channel;
        } catch (err) {
            this.#connected = undefined;
            throw err;
        }
    }

    async #reconnect(): Promise<void> {
        if (this.#connected === undefined)
            return;
        await (this.#connected = this.#connect());
    }

    public async connect(): Promise<void> {
        if (this.#connected !== undefined)
            throw new Error('Already connected');
        await (this.#connected = this.#connect());
    }

    public async disconnect(): Promise<void> {
        const channel = await this.#getChannel();
        this.#connected = undefined;
        await channel.close();
    }

    async #sendMessage<T>(exchange: string, filter: string, message: T): Promise<void> {
        const channel = await this.#getChannel();
        const content = Buffer.from(JSON.stringify(message));
        channel.publish(exchange, filter, content);
    }

    async #sendCommand<T>(filter: string, message: T): Promise<void> {
        await this.#sendMessage(GatewayMessageBroker.#commandsName, filter, message);
    }

    public async sendWorkerCommand<Type extends keyof WorkerMessageTypes>(type: Type, workerId: number, message: WorkerMessageTypes[Type]): Promise<void> {
        await this.#sendCommand(`${this.managerId}.worker.${workerId}.${type}`, message);
    }

    public async sendManagerCommand<Type extends keyof ManagerMessageTypes>(type: Type, message: ManagerMessageTypes[Type]): Promise<void> {
        await this.#sendCommand(`${this.managerId}.manager.${type}`, message);
    }

    public async sendGatewayEvent(shardId: number, lastShardId: number, event: discordeno.DiscordGatewayPayload): Promise<void> {
        await this.#sendMessage(GatewayMessageBroker.#eventsDedupeName, `${shardId}/${lastShardId}.${event.op}.${event.t ?? 'NONE'}`, { shardId, lastShardId, event });
    }

    async #handleMessage<T>(exchangeName: string | undefined, queueName: string, queueArgs: amqplib.Options.AssertQueue | undefined, filter: string, handler: (message: T) => Awaitable<void>): Promise<GatewayMessageHandler> {
        const channel = await this.#getChannel();
        await channel.assertQueue(queueName, queueArgs);
        if (exchangeName !== undefined)
            await channel.bindQueue(queueName, exchangeName, filter);
        const tag = await channel.consume(queueName, msg => {
            if (msg === null)
                return;

            const payload = JSON.parse(msg.content.toString()) as T;
            void handler(payload);
        }, { noAck: true });
        return {
            disconnect: async () => {
                const channel = await this.#getChannel();
                await channel.cancel(tag.consumerTag);
            }
        };
    }

    async #handleCommand<T>(queueName: string, filter: string, handler: (message: T) => Awaitable<void>): Promise<GatewayMessageHandler> {
        return await this.#handleMessage(GatewayMessageBroker.#commandsName, queueName, { autoDelete: true }, filter, handler);
    }

    public async handleWorkerCommand<Type extends keyof WorkerMessageTypes>(type: Type, workerId: number | '*', handler: (message: WorkerMessageTypes[Type]) => Awaitable<void>): Promise<GatewayMessageHandler> {
        return await this.#handleCommand(
            `${GatewayMessageBroker.#commandsName}-${type}-${randomUUID()}`,
            `${this.managerId}.worker.${workerId}.${type}`,
            handler
        );
    }

    public async handleManagerCommand<Type extends keyof ManagerMessageTypes>(type: Type, handler: (message: ManagerMessageTypes[Type]) => Awaitable<void>): Promise<GatewayMessageHandler> {
        return await this.#handleCommand(
            `${GatewayMessageBroker.#commandsName}-manager-${type}-${randomUUID()}`,
            `${this.managerId}.manager.${type}`,
            handler
        );
    }
}

export interface GatewayMessageHandler {
    disconnect(): Promise<void>;
}

export interface GatewayMessageBrokerOptions {
    readonly host: string;
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

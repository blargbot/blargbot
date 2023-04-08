import { randomUUID } from 'node:crypto';

import amqplib from 'amqplib';

import type { ConnectionOptions } from './ConnectionOptions.js';
import { ConsumeMessage } from './ConsumeMessage.js';
import type { HandleMessageOptions } from './HandleMessageOptions.js';
import type { MessageHandle } from './MessageHandle.js';

export class MessageHub {
    public static makeQueueName(service: string, name: string, constraint?: string): string {
        return constraint === undefined
            ? `[${service}]${name}`
            : `[${service}]${name}(${constraint})`;
    }

    readonly #replies: Map<string, { res(value: amqplib.ConsumeMessage): void; rej(err: unknown): void; }>;
    readonly #options: ConnectionOptions;
    readonly #socketOptions: unknown;
    readonly #prefetch: (c: amqplib.Channel) => Promise<unknown>;
    #connection?: Promise<amqplib.Channel>;
    #replyListener?: Promise<void>;
    #attemptReconnect: boolean;
    readonly #onConnected: Array<(channel: amqplib.Channel) => Awaitable<unknown>>;
    readonly #onDisconnected: Array<() => Awaitable<unknown>>;

    public constructor(options: ConnectionOptions, socketOptions?: unknown) {
        const { prefetch, ...opt } = options;
        this.#options = opt;
        this.#prefetch = prefetch === undefined ? () => Promise.resolve() : c => c.prefetch(prefetch);
        this.#socketOptions = socketOptions;
        this.#replies = new Map();
        this.#attemptReconnect = false;
        this.#onConnected = [];
        this.#onDisconnected = [];
    }

    protected async getChannel(): Promise<amqplib.Channel> {
        if (this.#connection === undefined)
            throw new Error('Not connected');
        return await this.#connection;
    }

    async #connect(): Promise<amqplib.Channel> {
        try {
            this.#attemptReconnect = false;
            const connection = await amqplib.connect(this.#options, this.#socketOptions);
            connection.once('close', () => void this.#onClose().catch(console.error));
            const channel = await connection.createChannel();
            channel.once('close', () => void connection.close().catch(console.error));

            await this.#emitConnected(channel);
            await this.#prefetch(channel);
            this.#attemptReconnect = true;
            return channel;
        } catch (err) {
            this.#connection = undefined;
            throw err;
        }
    }

    public onConnected(handler: (channel: amqplib.Channel) => Awaitable<unknown>): this {
        this.#onConnected.push(handler);
        return this;
    }
    public onDisconnected(handler: () => Awaitable<unknown>): this {
        this.#onDisconnected.push(handler);
        return this;
    }

    async #emitConnected(channel: amqplib.Channel): Promise<void> {
        await Promise.all(this.#onConnected.map(handle => handle(channel)));
    }

    async #emitDisconnected(): Promise<void> {
        await Promise.all(this.#onDisconnected.map(handle => handle()));
    }

    async #onClose(): Promise<void> {
        this.#connection = undefined;
        this.#replyListener = undefined;
        for (const waiter of this.#replies.values())
            waiter.rej(new Error('Channel closed before a response could be obtained'));
        this.#replies.clear();
        await this.#emitDisconnected();
        if (this.#attemptReconnect)
            await this.connect();
    }

    async #ensureReplyListener(): Promise<void> {
        await (this.#replyListener ??= this.#createReplyListener());
    }

    async #createReplyListener(): Promise<void> {
        try {
            const channel = await this.getChannel();
            await channel.consume('amq.rabbitmq.reply-to', msg => {
                if (msg === null)
                    return;
                const responseId = msg.properties.headers['x-response-id'] as unknown;
                if (typeof responseId === 'string') {
                    this.#replies.get(responseId)?.res(msg);
                    this.#replies.delete(responseId);
                }
            }, { noAck: true });
        } catch (err) {
            this.#replyListener = undefined;
            throw err;
        }
    }

    async #listenForReply(replyId: string): Promise<Blob> {
        const message = await new Promise<amqplib.ConsumeMessage>((res, rej) => {
            this.#replies.set(replyId, { res, rej });
        });
        return new Blob([message.content], { type: message.properties.contentType as string });
    }

    async #getBuffer(blob: Blob): Promise<Buffer> {
        return Buffer.from(await blob.arrayBuffer());
    }

    public async connect(): Promise<void> {
        if (this.#connection !== undefined)
            throw new Error('Already connected');
        await (this.#connection = this.#connect());
    }

    public async disconnect(): Promise<void> {
        this.#attemptReconnect = false;
        const channel = await this.#connection;
        await channel?.close();
    }

    public async publish(exchange: string, filter: string, message: Blob, options?: amqplib.Options.Publish): Promise<void> {
        const [channel, data] = await Promise.all([this.getChannel(), this.#getBuffer(message)]);
        channel.publish(exchange, filter, data, { ...options, contentType: message.type });
    }

    public async send(queue: string, message: Blob, options?: amqplib.Options.Publish): Promise<void> {
        const [channel, data] = await Promise.all([this.getChannel(), this.#getBuffer(message)]);
        channel.sendToQueue(queue, data, { ...options, contentType: message.type });
    }

    public async request(exchange: string, filter: string, message: Blob, options?: amqplib.Options.Publish): Promise<Blob> {
        const id = randomUUID();
        const [channel, data] = await Promise.all([this.getChannel(), this.#getBuffer(message), this.#ensureReplyListener()]);
        const replyPromise = this.#listenForReply(id);
        channel.publish(exchange, filter, data, {
            ...options,
            contentType: message.type,
            replyTo: 'amq.rabbitmq.reply-to',
            headers: {
                ['x-request-id']: id
            }
        });
        return await replyPromise;
    }

    async #handleMessage(impl: (data: Blob, message: ConsumeMessage) => Awaitable<Blob | void>, msg: ConsumeMessage): Promise<void> {
        try {
            const payload = new Blob([msg.content], { type: msg.properties.contentType as string });
            const result = await impl(payload, msg);
            if (result !== undefined && typeof msg.properties.replyTo === 'string') {
                await this.publish('', msg.properties.replyTo, result, {
                    headers: {
                        ['x-response-id']: msg.properties.headers['x-request-id'] as string | undefined
                    }
                });
            }
            msg.ack();
        } catch (err) {
            msg.nack({ requeue: false });
            console.error(err);
        }
    }

    public async handleMessage(options: HandleMessageOptions): Promise<MessageHandle> {
        const channel = await this.getChannel();
        await channel.assertQueue(options.queue, options.queueArgs);
        if ('exchange' in options) {
            const filters = typeof options.filter === 'string' ? [options.filter] : options.filter;
            for (const filter of filters)
                await channel.bindQueue(options.queue, options.exchange, filter);
        }
        const { handle, consumeArgs: { noAck = false } = {} } = options;
        const tag = await channel.consume(options.queue, msg => {
            if (msg === null)
                return;

            const message = new ConsumeMessage(channel, msg, !noAck);
            void this.#handleMessage(handle, message).catch(console.error);
        }, options.consumeArgs);
        return {
            disconnect: async () => {
                if (channel === await this.#connection)
                    await channel.cancel(tag.consumerTag);
            }
        };
    }
}

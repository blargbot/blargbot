import { randomUUID } from 'node:crypto';

import amqplib from 'amqplib';

export default abstract class MessageBroker {
    readonly #replies: Map<string, { res(value: amqplib.ConsumeMessage): void; rej(err: unknown): void; }>;
    readonly #options: ConnectionOptions;
    readonly #socketOptions: unknown;
    readonly #prefetch: (c: amqplib.Channel) => Promise<unknown>;
    #connection?: Promise<amqplib.Channel>;
    #replyListener?: Promise<void>;
    #attemptReconnect: boolean;

    public constructor(options: ConnectionOptions, socketOptions?: unknown) {
        const { prefetch, ...opt } = options;
        this.#options = opt;
        this.#prefetch = prefetch === undefined ? () => Promise.resolve() : c => c.prefetch(prefetch);
        this.#socketOptions = socketOptions;
        this.#replies = new Map();
        this.#attemptReconnect = false;
    }

    protected async getChannel(): Promise<amqplib.Channel> {
        if (this.#connection === undefined)
            throw new Error('Not connected');
        return await this.#connection;
    }

    async #connect(): Promise<amqplib.Channel> {
        try {
            this.#attemptReconnect = false;
            console.log(`Connecting to message bus at ${this.#options.hostname ?? 'UNDEFINED'}`);
            const connection = await amqplib.connect(this.#options, this.#socketOptions);
            connection.once('close', () => void this.#onClose().catch(console.error));
            const channel = await connection.createChannel();
            channel.once('close', () => void connection.close().catch(console.error));
            console.log('Connected to message bus');

            await this.onceConnected(channel);
            await this.#prefetch(channel);
            this.#attemptReconnect = true;
            return channel;
        } catch (err) {
            this.#connection = undefined;
            throw err;
        }
    }

    protected onceConnected(channel: amqplib.Channel): Awaitable<void> {
        channel;
    }

    protected onceDisconnected(): Awaitable<void> {
        this.#connection = undefined;
        this.#replyListener = undefined;
        for (const waiter of this.#replies.values())
            waiter.rej(new Error('Channel closed before a response could be obtained'));
        this.#replies.clear();
    }

    async #onClose(): Promise<void> {
        await this.onceDisconnected();
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
            });
        } catch (err) {
            this.#replyListener = undefined;
            throw err;
        }
    }

    async #listenForReply(replyId: string): Promise<Blob> {
        await this.#ensureReplyListener();
        const message = await new Promise<amqplib.ConsumeMessage>((res, rej) => {
            this.#replies.set(replyId, { res, rej });
        });
        return new Blob([message.content], { type: message.properties.contentType as string });
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

    protected async publish(exchange: string, filter: string, message: Blob, options?: amqplib.Options.Publish): Promise<void> {
        const channel = await this.getChannel();
        const buffer = Buffer.from(await message.arrayBuffer());
        channel.publish(exchange, filter, buffer, { ...options, contentType: message.type });
    }

    protected async send(queue: string, message: Blob, options?: amqplib.Options.Publish): Promise<void> {
        const channel = await this.getChannel();
        const buffer = Buffer.from(await message.arrayBuffer());
        channel.sendToQueue(queue, buffer, { ...options, contentType: message.type });
    }

    protected async sendRequest(exchange: string, filter: string, message: Blob, options?: amqplib.Options.Publish): Promise<Blob> {
        const id = randomUUID();
        const channel = await this.getChannel();
        const buffer = Buffer.from(await message.arrayBuffer());
        const reply = this.#listenForReply(id);
        channel.publish(exchange, filter, buffer, {
            ...options,
            contentType: message.type,
            headers: {
                ['x-request-id']: id
            }
        });
        return await reply;
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

    protected async handleMessage<This extends this>(this: This, options: HandleMessageOptions<This>): Promise<MessageHandle> {
        const h = this.#handleMessage.bind(this, options.handle.bind(this));
        const channel = await this.getChannel();
        await channel.assertQueue(options.queue, options.queueArgs);
        if (options.exchange !== undefined) {
            const filters = typeof options.filter === 'string' ? [options.filter] : options.filter;
            for (const filter of filters)
                await channel.bindQueue(options.queue, options.exchange, filter);
        }
        const tag = await channel.consume(options.queue, msg => {
            if (msg === null)
                return;

            const message = new ConsumeMessage(channel, msg, options.consumeArgs?.noAck !== true);
            void h(message).catch(console.error);
        }, options.consumeArgs);
        return {
            disconnect: async () => {
                if (channel === await this.#connection)
                    await channel.cancel(tag.consumerTag);
            }
        };
    }

    protected jsonToBlob(value: unknown): Blob {
        try {
            return new Blob([JSON.stringify(value)], { type: 'application/json' });
        } catch {
            throw new Error('Failed to convert value to a JSON blob');
        }
    }

    protected async blobToJson<T>(value: Blob): Promise<T> {
        if (value.type !== 'application/json')
            throw new Error(`Expected blob to be of type 'application/json' but found '${value.type}'`);
        try {
            return JSON.parse(await value.text()) as T;
        } catch {
            throw new Error('Blob content was declared to be of type \'application/json\' but is not valid json');
        }
    }
}

export interface ConnectionOptions extends amqplib.Options.Connect {
    readonly prefetch?: number;
}

export interface HandleMessageOptions<This> {
    queue: string;
    filter: string | Iterable<string>;
    handle: (this: This, data: Blob, message: ConsumeMessage) => Awaitable<Blob | void>;
    queueArgs?: amqplib.Options.AssertQueue;
    consumeArgs?: amqplib.Options.Consume;
    exchange?: string;
}

export class ConsumeMessage implements amqplib.ConsumeMessage {
    readonly #channel: amqplib.Channel;
    readonly #message: amqplib.ConsumeMessage;
    #ackSent: boolean;

    public get fields(): amqplib.ConsumeMessageFields {
        return this.#message.fields;
    }
    public get content(): Buffer {
        return this.#message.content;
    }
    public get properties(): amqplib.MessageProperties {
        return this.#message.properties;
    }

    public constructor(channel: amqplib.Channel, message: amqplib.ConsumeMessage, canNack: boolean) {
        this.#channel = channel;
        this.#message = message;
        this.#ackSent = !canNack;
    }

    public ack(): void {
        if (this.#ackSent)
            return;
        this.#ackSent = true;
        try {
            this.#channel.ack(this.#message);
        } catch {  /* NO-OP */ }
    }

    public nack(options: { allUpTo?: boolean; requeue?: boolean; } = {}): void {
        if (this.#ackSent)
            return;
        this.#ackSent = true;
        try {
            this.#channel.nack(this.#message, options.allUpTo, options.requeue);
        } catch {  /* NO-OP */ }
    }
}

export interface MessageHandle {
    disconnect(): Promise<void>;
}

import EventEmitter from 'node:events';

import type amqplib from 'amqplib';

export { DurableAmqplibChannel };
export default class DurableAmqplibChannel<Channel extends amqplib.Channel> extends EventEmitter implements amqplib.Channel {
    readonly #factory: () => Promise<Channel>;
    readonly #onConnect: Array<(channel: Channel) => Awaitable<unknown>>;
    readonly #tagMap: Map<string, (channel: Channel) => Awaitable<unknown>>;
    #channelPromise?: Promise<Channel>;
    #closed: boolean;

    public constructor(factory: () => Promise<Channel>) {
        super({ captureRejections: true });
        this.#factory = factory;
        this.#onConnect = [];
        this.#closed = false;
        this.#tagMap = new Map();
        void this.#keepAlive();
    }

    async #keepAlive(): Promise<void> {
        while (!this.#closed) {
            const channel = await this.#getChannel();
            await new Promise<void>(res => channel.once('close', res));
        }
    }

    #getChannel(): Promise<Channel> {
        return this.#channelPromise ??= this.#createChannel()
            .then(c => c.once('close', () => this.#channelPromise = undefined))
            .catch(err => {
                this.#channelPromise = undefined;
                throw err;
            });
    }

    async #createChannel(): Promise<Channel> {
        if (this.#closed === true)
            throw new Error('This channel has been explicitly closed and cannot be used any more.');
        const channel = await this.#factory();
        channel.on('error', (...args: unknown[]) => this.emit('error', ...args));
        channel.on('return', (...args: unknown[]) => this.emit('return', ...args));
        channel.on('drain', (...args: unknown[]) => this.emit('drain', ...args));
        for (const step of this.#onConnect) {
            try {
                await step(channel);
            } catch (err) {
                this.emit('error', err);
                throw err;
            }
        }
        return channel;
    }

    public async invoke<T>(action: (channel: Channel) => Awaitable<T>, replayOnReconnect = false): Promise<T> {
        const channel = await this.#getChannel();
        const result = await action(channel);
        if (replayOnReconnect)
            this.#onConnect.push(action);
        return result;
    }

    public async waitOpen(): Promise<void> {
        await this.#getChannel();
    }

    public async close(): Promise<void> {
        this.#closed = true;
        if (this.#channelPromise === undefined)
            return;

        await this.invoke(c => c.close());
        this.emit('close');
    }

    public assertQueue(queue: string, options?: amqplib.Options.AssertQueue | undefined): Promise<amqplib.Replies.AssertQueue> {
        return this.invoke(c => c.assertQueue(queue, options), true);
    }

    public checkQueue(queue: string): Promise<amqplib.Replies.AssertQueue> {
        return this.invoke(c => c.checkQueue(queue), true);
    }

    public deleteQueue(queue: string, options?: amqplib.Options.DeleteQueue | undefined): Promise<amqplib.Replies.DeleteQueue> {
        return this.invoke(c => c.deleteQueue(queue, options), true);
    }

    public purgeQueue(queue: string): Promise<amqplib.Replies.PurgeQueue> {
        return this.invoke(c => c.purgeQueue(queue));
    }

    public bindQueue(queue: string, source: string, pattern: string, args?: unknown): Promise<amqplib.Replies.Empty> {
        return this.invoke(c => c.bindQueue(queue, source, pattern, args), true);
    }

    public unbindQueue(queue: string, source: string, pattern: string, args?: unknown): Promise<amqplib.Replies.Empty> {
        return this.invoke(c => c.unbindQueue(queue, source, pattern, args), true);
    }

    public assertExchange(exchange: string, type: string, options?: amqplib.Options.AssertExchange | undefined): Promise<amqplib.Replies.AssertExchange> {
        return this.invoke(c => c.assertExchange(exchange, type, options), true);
    }

    public checkExchange(exchange: string): Promise<amqplib.Replies.Empty> {
        return this.invoke(c => c.checkExchange(exchange), true);
    }

    public deleteExchange(exchange: string, options?: amqplib.Options.DeleteExchange | undefined): Promise<amqplib.Replies.Empty> {
        return this.invoke(c => c.deleteExchange(exchange, options), true);
    }

    public bindExchange(destination: string, source: string, pattern: string, args?: unknown): Promise<amqplib.Replies.Empty> {
        return this.invoke(c => c.bindExchange(destination, source, pattern, args), true);
    }

    public unbindExchange(destination: string, source: string, pattern: string, args?: unknown): Promise<amqplib.Replies.Empty> {
        return this.invoke(c => c.unbindExchange(destination, source, pattern, args), true);
    }

    public publish(exchange: string, routingKey: string, content: Buffer, options?: amqplib.Options.Publish | undefined): boolean {
        void this.invoke(c => c.publish(exchange, routingKey, content, options)).catch(noOp);
        return !this.#closed;
    }

    public sendToQueue(queue: string, content: Buffer, options?: amqplib.Options.Publish | undefined): boolean {
        void this.invoke(c => c.sendToQueue(queue, content, options)).catch(noOp);
        return !this.#closed;
    }

    public consume(queue: string, onMessage: (msg: amqplib.ConsumeMessage | null) => void, options?: amqplib.Options.Consume | undefined): Promise<amqplib.Replies.Consume> {
        const action = async (c: amqplib.Channel): Promise<amqplib.Replies.Consume> => {
            const result = await c.consume(queue, onMessage, options);
            this.#tagMap.set(result.consumerTag, action);
            return result;
        };
        return this.invoke(action, true);
    }

    public cancel(consumerTag: string): Promise<amqplib.Replies.Empty> {
        const action = this.#tagMap.get(consumerTag);
        if (action === undefined)
            return Promise.resolve({});

        this.#tagMap.delete(consumerTag);
        const index = this.#onConnect.indexOf(action);
        if (index !== -1)
            this.#onConnect.splice(index, 1);

        if (this.#channelPromise === undefined)
            return Promise.resolve({});

        return this.invoke(c => c.cancel(consumerTag));
    }

    public get(queue: string, options?: amqplib.Options.Get | undefined): Promise<false | amqplib.GetMessage> {
        return this.invoke(c => c.get(queue, options));
    }

    public ack(message: amqplib.Message, allUpTo?: boolean | undefined): void {
        void this.invoke(c => c.ack(message, allUpTo)).catch(noOp);
    }

    public ackAll(): void {
        void this.invoke(c => c.ackAll()).catch(noOp);
    }

    public nack(message: amqplib.Message, allUpTo?: boolean | undefined, requeue?: boolean | undefined): void {
        void this.invoke(c => c.nack(message, allUpTo, requeue)).catch(noOp);
    }

    public nackAll(requeue?: boolean | undefined): void {
        void this.invoke(c => c.nackAll(requeue)).catch(noOp);
    }

    public reject(message: amqplib.Message, requeue?: boolean | undefined): void {
        void this.invoke(c => c.reject(message, requeue)).catch(noOp);
    }

    public prefetch(count: number, global?: boolean | undefined): Promise<amqplib.Replies.Empty> {
        return this.invoke(c => c.prefetch(count, global));
    }

    public recover(): Promise<amqplib.Replies.Empty> {
        return this.invoke(c => c.recover());
    }
}

function noOp(): void {
    // NO-OP
}

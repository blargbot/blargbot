import type { PushIterable } from '@blargbot/util';
import { createPushIterable, whenAborted } from '@blargbot/util';
import type { Options } from 'amqplib';
import { randomUUID } from 'crypto';

import type { AmqpChannel, AmqpConsumeMessage, AmqpConsumer, AmqpExchange, AmqpQueue, AmqpReplyOptions } from '../AmqpChannel.js';
import type { AmqpMessage } from '../messages/AmqpMessage.js';

export class ReplyTarget implements AsyncDisposable {
    readonly #consumeOptions: Options.Consume;
    readonly #queueOptions: Options.AssertQueue | undefined;
    readonly #queueName: string;
    readonly #channel: AmqpChannel;
    readonly #streams = new Map<string, PushIterable<AmqpConsumeMessage>>();

    #lazyConsumer?: Promise<AsyncDisposable & { signal: AbortSignal; }>;

    public get queueName(): string {
        return this.#queueName;
    }

    public constructor(options: {
        channel: AmqpChannel;
        queuePrefix: string;
        queueOptions?: Omit<Options.AssertQueue, 'autoDelete' | 'exclusive'>;
        assertQueue?: boolean;
        consumeOptions?: Omit<Options.Consume, 'noAck' | 'exclusive'>;
    }) {
        this.#channel = options.channel;
        this.#queueName = `${options.queuePrefix}.replies.${randomUUID()}`;
        this.#queueOptions = { ...options.queueOptions, autoDelete: true, exclusive: true };
        this.#consumeOptions = { ...options.consumeOptions, noAck: true, exclusive: true };
    }

    async #makeConsumer(): Promise<AmqpConsumer> {
        const queue = await this.#channel.assertQueue(this.#queueName, this.#queueOptions);
        const consumer = await queue.consume(message => {
            if (message.properties.correlationId === undefined)
                return;

            this.#streams.get(message.properties.correlationId)?.next(message);
        }, this.#consumeOptions);
        whenAborted(consumer.signal, () => {
            for (const stream of this.#streams.values())
                stream.throw(consumer.signal.reason);
            this.#streams.clear();
        });
        const baseDispose = consumer[Symbol.asyncDispose];
        consumer[Symbol.asyncDispose] = async () => {
            using _0 = queue;
            await baseDispose.call(consumer);
        };
        return consumer;
    }

    public async [Symbol.asyncDispose](): Promise<void> {
        this.#lazyConsumer ??= Promise.resolve(makeFakeConsumer());
        const consumer = await this.#lazyConsumer;
        await consumer[Symbol.asyncDispose]();
    }

    public async * stream(correlationId: string, signal?: AbortSignal): AsyncGenerator<AmqpConsumeMessage, void, void> {
        const consumer = await (this.#lazyConsumer ??= this.#makeConsumer());
        consumer.signal.throwIfAborted();
        if (this.#streams.has(correlationId))
            throw new Error('Correlationid is already in use.');
        const stream = createPushIterable<AmqpConsumeMessage>();
        this.#streams.set(correlationId, stream);
        using _onAbort = whenAborted(signal, () => stream.done());
        try {
            yield* stream.items;
        } finally {
            this.#streams.delete(correlationId);
        }
    }

    public async waitFor(correlationId: string, signal?: AbortSignal): Promise<AmqpConsumeMessage> {
        for await (const item of this.stream(correlationId, signal))
            return item;
        throw new Error('No message was receieved.');
    }

    public async getQueueResponse(queue: AmqpQueue, message: AmqpMessage, options?: Omit<AmqpReplyOptions, 'replyTo'>): Promise<AmqpConsumeMessage> {
        const correlationId = randomUUID();
        const responsePromise = this.waitFor(correlationId, options?.signal);
        await queue.send(message, { ...options, correlationId, replyTo: this.#queueName });
        return await responsePromise;
    }

    public async getExchangeResponse(exchange: AmqpExchange, routingKey: string, message: AmqpMessage, options?: Omit<AmqpReplyOptions, 'replyTo'>): Promise<AmqpConsumeMessage> {
        const correlationId = randomUUID();
        const responsePromise = this.waitFor(correlationId, options?.signal);
        await exchange.send(routingKey, message, { ...options, correlationId, replyTo: this.#queueName });
        return await responsePromise;
    }
}

function makeFakeConsumer(): AsyncDisposable & { signal: AbortSignal; } {
    const controller = new AbortController();
    return {
        signal: controller.signal,
        [Symbol.asyncDispose]() {
            controller.abort(new Error('Consumer was disposed'));
            return Promise.resolve();
        }
    };
}

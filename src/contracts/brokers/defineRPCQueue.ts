import type { Channel, ConsumeMessage, Options } from 'amqplib';
import { randomUUID } from 'crypto';
import type z from 'zod';

import type AmqpMessage from '../messages/AmqpMessage.js';
import { AmqpMessageProperties } from '../messages/StrongAmqpProperties.js';
import { addScopedHandler, asBuffer, asUint8Array, sendToQueueWithRetries } from '../util.js';
import { createConsumer } from './createConsumer.js';

export interface RpcQueueHandlerOptions<Response> {
    readonly catch?: (error: unknown, message: ConsumeMessage) => Awaitable<Response>;
    readonly consumeOptions?: Omit<Options.Consume, 'noAck'>;
}

export interface RpcQueue<Request, Response> extends AsyncDisposable {
    readonly name: string;
    send(request: Request, signal?: AbortSignal): Promise<Response>;
    handle(message: (request: Request) => Awaitable<Response>, options?: RpcQueueHandlerOptions<Response>): Promise<AsyncDisposable>;
}

export type RpcMessageOptions = Omit<Options.Publish, 'contentType' | 'contentEncoding' | 'correlationId' | 'replyTo'>;

export interface RpcQueueConfig<Request, Response> {
    readonly channel: Channel;
    readonly queueName: string;
    readonly request: z.ZodType<Request, AmqpMessage>;
    readonly response: z.ZodType<Response, AmqpMessage>;
    readonly queueOptions?: Options.AssertQueue;
    readonly requestOptions?: RpcMessageOptions;
    readonly responseOptions?: RpcMessageOptions;
}

export async function defineRPCQueue<Request, Response>(config: RpcQueueConfig<Request, Response>): Promise<RpcQueue<Request, Response>> {
    const { channel, queueName, request, response, queueOptions, requestOptions, responseOptions } = config;
    const { queue } = await channel.assertQueue(queueName, queueOptions);
    const pending = new Map<string, (message: ConsumeMessage) => void>();
    let replyTo: { queue: string; lifetime: AsyncDisposable; } | undefined | false;

    return {
        name: queue,
        async send(message, signal) {

            replyTo ??= await getReplyTo(queue, channel, pending);

            signal ??= new AbortController().signal;

            const correlationId = randomUUID();
            const { promise, resolve, reject } = Promise.withResolvers<ConsumeMessage>();
            using _onAborted = addScopedHandler(signal, 'abort', () => {
                pending.delete(correlationId);
                reject(signal.reason);
            });
            pending.set(correlationId, resolve);

            const { content, contentType, contentEncoding } = await request.encodeAsync(message);

            if (replyTo === false)
                throw new Error('Queue has been disposed');

            await sendToQueueWithRetries(channel, queue, asBuffer(content), {
                ...requestOptions,
                correlationId,
                replyTo: replyTo.queue,
                contentType,
                contentEncoding
            });

            const result = await promise;

            const resultProps = AmqpMessageProperties.decode(result.properties);

            return await response.decodeAsync({
                content: asUint8Array(result.content),
                contentType: resultProps.contentType,
                contentEncoding: resultProps.contentEncoding
            });
        },
        async handle(handler, options = {}) {
            const { catch: $catch, consumeOptions } = options;
            return await createConsumer(channel, queue, handleAsyc, { ...consumeOptions, noAck: false });

            async function handleAsyc(message: ConsumeMessage): Promise<void> {
                const { replyTo, correlationId, contentType, contentEncoding } = AmqpMessageProperties.decode(message.properties);
                try {
                    let res;
                    try {
                        const req = await request.decodeAsync({
                            content: asUint8Array(message.content),
                            contentType: typeof contentType === 'string' ? contentType : undefined,
                            contentEncoding
                        });
                        res = await handler(req);

                    } catch (error) {
                        if ($catch === undefined)
                            throw error;
                        res = await $catch(error, message);
                    }

                    if (typeof replyTo === 'string') {
                        const { content, contentType, contentEncoding } = await response.encodeAsync(res);
                        await sendToQueueWithRetries(channel, replyTo, asBuffer(content), {
                            ...responseOptions,
                            correlationId: typeof correlationId === 'string' ? correlationId : undefined,
                            contentType,
                            contentEncoding,
                            replyTo: undefined
                        });
                    }
                } finally {
                    channel.ack(message);
                }
            }
        },
        async [Symbol.asyncDispose]() {
            const r = replyTo;
            replyTo = false;
            if (typeof r === 'object')
                await r.lifetime[Symbol.asyncDispose]();
        }
    };

}

async function getReplyTo(queueName: string, channel: Channel, pending: Map<string, (message: ConsumeMessage) => void>): Promise<{
    queue: string;
    lifetime: AsyncDisposable;
}> {
    const { queue } = await channel.assertQueue(`${queueName}.replies.${randomUUID()}`, { autoDelete: true, exclusive: true });
    const lifetime = await createConsumer(channel, queue, message => {
        const { correlationId } = AmqpMessageProperties.decode(message.properties);
        if (correlationId === undefined)
            return;
        const resolve = pending.get(correlationId);
        if (resolve === undefined)
            return;
        pending.delete(correlationId);
        resolve(message);
    }, { noAck: true, exclusive: true, arguments: { ['x-single-active-consumer']: true } });
    return { queue, lifetime };
}

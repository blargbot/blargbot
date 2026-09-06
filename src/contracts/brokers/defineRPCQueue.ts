import type { Channel, ConsumeMessage, Options } from 'amqplib';
import { randomUUID } from 'crypto';
import type z from 'zod';

import type AmqpMessage from '../messages/AmqpMessage.js';
import { AmqpMessageProperties } from '../messages/StrongAmqpProperties.js';
import { addScopedHandler, asBuffer, asUint8Array, sendToQueueWithRetries } from '../util.js';

export interface RpcQueueHandlerOptions<Response> {
    readonly catch?: (error: unknown, message: ConsumeMessage) => Awaitable<Response>;
    readonly signal?: AbortSignal;
}

export interface RpcQueue<Request, Response> {
    readonly name: string;
    send(request: Request, signal?: AbortSignal): Promise<Response>;
    handle(message: (request: Request) => Awaitable<Response>, options?: RpcQueueHandlerOptions<Response>): Promise<void>;
}

export async function defineRPCQueue<Request, Response>(
    channel: Channel,
    queueName: string,
    request: z.ZodType<Request, AmqpMessage>,
    response: z.ZodType<Response, AmqpMessage>,
    options?: Options.AssertQueue
): Promise<RpcQueue<Request, Response>> {
    const { queue } = await channel.assertQueue(queueName, options);
    const pending = new Map<string, (message: ConsumeMessage) => void>();
    let replyTo: string | undefined;

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

            await sendToQueueWithRetries(channel, queue, asBuffer(content), {
                correlationId,
                replyTo,
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
            const { signal, catch: $catch } = options;
            const { consumerTag } = await channel.consume(queue, message => {
                if (message === null)
                    return;

                void handleAsyc(message);
            });
            signal?.addEventListener('abort', () => void channel.cancel(consumerTag).catch(() => { }));

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
                            correlationId: typeof correlationId === 'string' ? correlationId : undefined,
                            contentType,
                            contentEncoding
                        });
                    }
                } finally {
                    channel.ack(message);
                }
            }
        }
    };

}

async function getReplyTo(queueName: string, channel: Channel, pending: Map<string, (message: ConsumeMessage) => void>): Promise<string> {
    const { queue } = await channel.assertQueue(`${queueName}.replies.${randomUUID()}`, { autoDelete: true });
    await channel.consume(queue, message => {
        if (message === null)
            return;
        const { correlationId } = AmqpMessageProperties.decode(message.properties);
        if (correlationId === undefined)
            return;
        const resolve = pending.get(correlationId);
        if (resolve === undefined)
            return;
        pending.delete(correlationId);
        resolve(message);
    }, { noAck: true });
    return queue;
}

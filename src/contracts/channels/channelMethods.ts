import { randomUUID } from 'node:crypto';

import type { Options } from 'amqplib';

import type { AmqpChannel, AmqpConsumeOptions, AmqpConsumer, AmqpExchange, AmqpQueue, AmqpReplyOptions } from '../AmqpChannel.js';
import type { AmqpMessage } from '../messages/AmqpMessage.js';
import { ReplyTarget } from './ReplyTarget.js';

type ConsumeKeys = keyof Options.Consume;
export type AmqpChannelMethods<
    Send extends PropertyKey,
    Handle extends PropertyKey,
    Request,
    Response = void,
    SendArgs extends readonly unknown[] = [],
    HandleArgs extends readonly unknown[] = []
>
    = (
        { [P in Send]: (...args: [message: Request, ...SendArgs, signal?: AbortSignal]) => Promise<Response> }
        & { [P in Handle]: (...args: [handler: (message: Request) => Awaitable<Response>, ...HandleArgs]) => Promise<AmqpConsumer> }
        & AsyncDisposable
    ) extends infer P ? { [R in keyof P]: P[R] } : never

interface AmqpEncoder<Message> {
    encodeAsync(message: Message): Promise<AmqpMessage>;
    decodeAsync(message: AmqpMessage): Promise<Message>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MergeAmqpChannelMethods<T extends AmqpChannelMethods<never, never, any, any, any, any>>
    = (T extends unknown ? (value: T) => void : never) extends ((value: infer R) => void)
    ? { [P in keyof R]: R[P] }
    : never;

export interface ChannelExchangeMethodHelperBase<Options, OmitConsume extends ConsumeKeys> {
    defineNotification<const Send extends PropertyKey, const Handle extends PropertyKey, Message>(options: Options & {
        send: Send;
        handle: Handle;
        encoder: AmqpEncoder<Message>;
        sendOptions?: (message: Message, encoded: AmqpMessage) => Omit<AmqpReplyOptions, 'replyTo' | 'signal'>;
        consumeOptions?: Omit<AmqpConsumeOptions, 'noAck' | OmitConsume>;
        badRequest?: (error: unknown) => void;
    }): AmqpChannelMethods<Send, Handle, Message>;
    defineRequest<const Send extends PropertyKey, const Handle extends PropertyKey, Request, Response>(options: Options & {
        send: Send;
        handle: Handle;
        requestEncoder: AmqpEncoder<Request>;
        responseEncoder: AmqpEncoder<Response>;
        sendOptions?: (message: Request, encoded: AmqpMessage) => Omit<AmqpReplyOptions, 'replyTo' | 'signal'>;
        replyOptions?: (message: Response, encoded: AmqpMessage) => Omit<AmqpReplyOptions, 'replyTo'>;
        consumeOptions?: Omit<AmqpConsumeOptions, 'noAck' | OmitConsume>;
        badRequest?: (error: unknown) => Response;
    }): AmqpChannelMethods<Send, Handle, Request, Response>;
}

export interface ChannelExchangeMethodHelper extends ChannelExchangeMethodHelperBase<{ routingKey: string; }, 'exclusive'> {
    defineWorkerNotification<const Send extends PropertyKey, const Handle extends PropertyKey, Message>(options: {
        routingKey: string;
        send: Send;
        handle: Handle;
        workerId: string;
        encoder: AmqpEncoder<Message>;
        sendOptions?: (message: Message, encoded: AmqpMessage) => Omit<AmqpReplyOptions, 'replyTo' | 'signal'>;
        consumeOptions?: Omit<AmqpConsumeOptions, 'noAck' | 'exclusive'>;
        badRequest?: (error: unknown) => void;
    }): AmqpChannelMethods<Send, Handle, Message, void, [workerId: string]>;
    defineWorkerRequest<const Send extends PropertyKey, const Handle extends PropertyKey, Request, Response>(options: {
        routingKey: string;
        send: Send;
        handle: Handle;
        workerId: string;
        requestEncoder: AmqpEncoder<Request>;
        responseEncoder: AmqpEncoder<Response>;
        sendOptions?: (message: Request, encoded: AmqpMessage) => Omit<AmqpReplyOptions, 'replyTo' | 'signal'>;
        replyOptions?: (message: Response, encoded: AmqpMessage) => Omit<AmqpReplyOptions, 'replyTo' | 'signal'>;
        consumeOptions?: Omit<AmqpConsumeOptions, 'noAck' | 'exclusive'>;
        badRequest?: (error: unknown) => Response;
    }): AmqpChannelMethods<Send, Handle, Request, Response, [workerId: string]>;
}
export type ChannelQueueMethodHelper = ChannelExchangeMethodHelperBase<unknown, never>;

export const amqpChannelHelper = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    merge<const Methods extends ReadonlyArray<AmqpChannelMethods<never, never, any, any, any, any>>>(...args: Methods): MergeAmqpChannelMethods<Methods[number]> {
        const result: Partial<MergeAmqpChannelMethods<Methods[number]>> = {};
        for (const arg of args)
            Object.assign(result, arg);
        let disposed = false;
        Object.assign(result, {
            async [Symbol.asyncDispose]() {
                if (disposed)
                    return;

                disposed = true;
                let i = args.length;;
                try {
                    for (i--; i >= 0; i--)
                        await args[i][Symbol.asyncDispose]();
                } catch (error) {
                    let finalError = error;
                    for (i--; i >= 0; i--) {
                        try {
                            await args[i][Symbol.asyncDispose]();
                        } catch (err) {
                            finalError = err;
                        }
                    }
                    throw finalError;
                }
            }
        });
        return result as MergeAmqpChannelMethods<Methods[number]>;
    },
    onExchange(channel: AmqpChannel, exchange: AmqpExchange): ChannelExchangeMethodHelper {
        return {
            defineNotification(options) {
                const { routingKey, send, handle, encoder, sendOptions, consumeOptions, badRequest } = options;
                const queuePrefix = `${exchange.name}.${routingKey}`;

                return stronglyType(send, handle, (send, handle) => ({
                    async [send](message, signal) {
                        const request = await encoder.encodeAsync(message);
                        await exchange.send(routingKey, request, { ...sendOptions?.(message, request), signal });
                    },
                    async [handle](handler) {
                        return await consumeTemporaryQueue(
                            channel, queuePrefix, exchange, routingKey,
                            queue => consumeWithoutReply(
                                queue, encoder, handler, badRequest,
                                { ...consumeOptions, exclusive: true }
                            )
                        );
                    },
                    async [Symbol.asyncDispose]() {
                        await Promise.resolve();
                    }
                }));
            },
            defineWorkerNotification(options) {
                const { routingKey, send, handle, workerId, encoder, sendOptions, consumeOptions, badRequest } = options;
                const queuePrefix = `${exchange.name}.${routingKey}`;

                return stronglyType(send, handle, (send, handle) => ({
                    async [send](message, workerId, signal) {
                        const request = await encoder.encodeAsync(message);
                        await exchange.send(`${routingKey}.${workerId}`, request, { ...sendOptions?.(message, request), signal });
                    },
                    async [handle](handler) {
                        return await consumeTemporaryQueue(
                            channel, `${queuePrefix}.${workerId}`, exchange, `${routingKey}.${workerId}`,
                            queue => consumeWithoutReply(
                                queue, encoder, handler, badRequest,
                                { ...consumeOptions, exclusive: true }
                            )
                        );
                    },
                    async [Symbol.asyncDispose]() {
                        await Promise.resolve();
                    }
                }));
            },
            defineRequest(options) {
                const { routingKey, send, handle, requestEncoder, responseEncoder, sendOptions, replyOptions, consumeOptions, badRequest } = options;
                const queuePrefix = `${exchange.name}.${routingKey}`;
                const replyTo = new ReplyTarget({ channel, queuePrefix });

                return stronglyType(send, handle, (send, handle) => ({
                    async [send](message, signal) {
                        const request = await requestEncoder.encodeAsync(message);
                        const response = await replyTo.getExchangeResponse(exchange, routingKey, request, { ...sendOptions?.(message, request), signal });
                        return await responseEncoder.decodeAsync(response);
                    },
                    async [handle](handler) {
                        return await consumeTemporaryQueue(
                            channel, queuePrefix, exchange, routingKey,
                            queue => consumeWithReply(
                                queue, requestEncoder, responseEncoder, handler, badRequest,
                                { ...consumeOptions, exclusive: true }, replyOptions
                            )
                        );
                    },
                    async [Symbol.asyncDispose]() {
                        await replyTo[Symbol.asyncDispose]();
                    }
                }));
            },
            defineWorkerRequest(options) {
                const { routingKey, send, handle, workerId, requestEncoder, responseEncoder, sendOptions, replyOptions, consumeOptions, badRequest } = options;
                const queuePrefix = `${exchange.name}.${routingKey}`;
                const replyTo = new ReplyTarget({ channel, queuePrefix });

                return stronglyType(send, handle, (send, handle) => ({
                    async [send](message, workerId, signal) {
                        const request = await requestEncoder.encodeAsync(message);
                        const response = await replyTo.getExchangeResponse(exchange, `${routingKey}.${workerId}`, request, { ...sendOptions?.(message, request), signal });
                        return await responseEncoder.decodeAsync(response);
                    },
                    async [handle](handler) {
                        return await consumeTemporaryQueue(
                            channel, `${queuePrefix}.${workerId}`, exchange, `${routingKey}.${workerId}`,
                            queue => consumeWithReply(
                                queue, requestEncoder, responseEncoder, handler, badRequest,
                                { ...consumeOptions, exclusive: true }, replyOptions
                            )
                        );
                    },
                    async [Symbol.asyncDispose]() {
                        await replyTo[Symbol.asyncDispose]();
                    }
                }));
            }
        };
    },
    onQueue(channel: AmqpChannel, queue: AmqpQueue): ChannelQueueMethodHelper {
        return {
            defineNotification(options) {
                const { send, handle, encoder, sendOptions, consumeOptions, badRequest } = options;
                return stronglyType(send, handle, (send, handle) => ({
                    async [send](message, signal) {
                        const request = await encoder.encodeAsync(message);
                        await queue.send(request, { ...sendOptions?.(message, request), signal });
                    },
                    async [handle](handler) {
                        return await consumeWithoutReply(
                            queue,
                            encoder,
                            handler,
                            badRequest,
                            consumeOptions
                        );
                    },
                    async [Symbol.asyncDispose]() {
                        await Promise.resolve();
                    }
                }));
            },
            defineRequest(options) {
                const { send, handle, requestEncoder, responseEncoder, sendOptions, replyOptions, consumeOptions, badRequest } = options;
                const replyTo = new ReplyTarget({ channel, queuePrefix: queue.name });

                return stronglyType(send, handle, (send, handle) => ({
                    async [send](message, signal) {
                        const request = await requestEncoder.encodeAsync(message);
                        const response = await replyTo.getQueueResponse(queue, request, { ...sendOptions?.(message, request), signal });
                        return await responseEncoder.decodeAsync(response);
                    },
                    async [handle](handler) {
                        return await consumeWithReply(
                            queue,
                            requestEncoder,
                            responseEncoder,
                            handler,
                            badRequest,
                            consumeOptions,
                            replyOptions
                        );
                    },
                    async [Symbol.asyncDispose]() {
                        await replyTo[Symbol.asyncDispose]();
                    }
                }));
            }
        };
    }
};

function stronglyType<
    Send extends PropertyKey,
    Handle extends PropertyKey,
    Request,
    Response,
    SendArgs extends readonly unknown[],
    HandleArgs extends readonly unknown[]
>(
    send: Send,
    handle: Handle,
    factory: (send: '$send', handle: '$handle') => AmqpChannelMethods<'$send', '$handle', Request, Response, SendArgs, HandleArgs>
): AmqpChannelMethods<Send, Handle, Request, Response, SendArgs, HandleArgs> {
    return factory(send as '$send', handle as '$handle') as never;
}

async function consumeTemporaryQueue(channel: AmqpChannel, queuePrefix: string, exchange: AmqpExchange, routingKey: string, consume: (queue: AmqpQueue) => Promise<AmqpConsumer>): Promise<AmqpConsumer> {
    const queue = await channel.assertQueue(`${queuePrefix}.${randomUUID()}`, { autoDelete: true, exclusive: true });
    await queue.bind(exchange, routingKey);
    const consumer = await consume(queue);
    const baseDispose = consumer[Symbol.asyncDispose];
    consumer[Symbol.asyncDispose] = async () => {
        using _0 = queue;
        await baseDispose.call(consumer);
    };
    return consumer;
}

async function consumeWithReply<Request, Response>(
    queue: AmqpQueue,
    requestEncoder: AmqpEncoder<Request>,
    responseEncoder: AmqpEncoder<Response>,
    handler: (request: Request) => Awaitable<Response>,
    badRequest: undefined | ((error: unknown) => Response),
    consumeOptions: undefined | Omit<AmqpConsumeOptions, 'noAck'>,
    replyOptions: undefined | ((message: Response, encoded: AmqpMessage) => Omit<AmqpReplyOptions, 'replyTo'>)
): Promise<AmqpConsumer> {
    return await queue.consume(async message => {
        const response = await requestEncoder.decodeAsync(message)
            .then(handler, badRequest);
        const encoded = await responseEncoder.encodeAsync(response);
        await message.reply(encoded, replyOptions?.(response, encoded));
    }, { ...consumeOptions, noAck: false });
}

async function consumeWithoutReply<Request>(
    queue: AmqpQueue,
    requestEncoder: AmqpEncoder<Request>,
    handler: (request: Request) => Awaitable<void>,
    badRequest: undefined | ((error: unknown) => void),
    consumeOptions: undefined | Omit<AmqpConsumeOptions, 'noAck'>
): Promise<AmqpConsumer> {
    return await queue.consume(async message => {
        await requestEncoder.decodeAsync(message)
            .then(handler, badRequest);
    }, { ...consumeOptions, noAck: false });
}

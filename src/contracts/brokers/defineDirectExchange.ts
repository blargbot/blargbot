import type { Channel, ConsumeMessage, Options } from 'amqplib';
import { randomUUID } from 'crypto';
import type z from 'zod';

import type AmqpMessage from '../messages/AmqpMessage.js';
import { AmqpMessageProperties } from '../messages/StrongAmqpProperties.js';
import { asBuffer, asUint8Array, publishWithRetries } from '../util.js';

export interface DirectExchange<Messages extends Record<string, unknown>> {
    readonly name: string;
    send<Kind extends string & keyof Messages>(kind: Kind, message: Messages[Kind]): Promise<void>;
    handle<Kind extends string & keyof Messages>(kind: Kind, handler: (message: Messages[Kind]) => Awaitable<void>, signal?: AbortSignal): Promise<void>;
}

export async function defineDirectExchange<Messages extends Record<string, unknown>>(
    channel: Channel,
    exchangeName: string,
    types: { [P in keyof Messages]: z.ZodType<Messages[P], AmqpMessage> },
    options?: Options.AssertExchange
): Promise<DirectExchange<Messages>> {
    const { exchange } = await channel.assertExchange(exchangeName, 'direct', options);

    return {
        name: exchange,
        async send(kind, message) {
            const type = getType(kind, types);
            const { content, contentType, contentEncoding } = await type.encodeAsync(message);
            await publishWithRetries(channel, exchange, kind, asBuffer(content), {
                contentType,
                contentEncoding
            });
        },
        async handle(kind, handler, signal) {
            const type = getType(kind, types);
            const { queue } = await channel.assertQueue(`${exchange}.${kind}.${randomUUID()}`, { autoDelete: true });
            await channel.bindQueue(queue, exchange, kind);
            const { consumerTag } = await channel.consume(queue, message => {
                if (message === null)
                    return;
                void handleAsync(message);
            }, { noAck: true });
            signal?.addEventListener('abort', () => void channel.cancel(consumerTag).catch(() => { }));

            async function handleAsync(message: ConsumeMessage): Promise<void> {
                const { contentType, contentEncoding } = AmqpMessageProperties.decode(message.properties);
                const request = await type.decodeAsync({
                    content: asUint8Array(message.content),
                    contentType,
                    contentEncoding
                });
                await handler(request);
            }
        }
    };
}

function getType<Kind extends string & keyof Messages, Messages extends Record<string, unknown>>(
    kind: Kind,
    types: { [P in keyof Messages]: z.ZodType<Messages[P], AmqpMessage> }
): z.ZodType<Messages[Kind], AmqpMessage> {
    if (!Object.hasOwn(types, kind))
        throw new Error(`Unsupported routing key ${kind} for this exchange`);
    return types[kind];
}

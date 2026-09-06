import type { Channel, ConsumeMessage, Options } from 'amqplib';
import { randomUUID } from 'crypto';
import type z from 'zod';

import type AmqpMessage from '../messages/AmqpMessage.js';
import { AmqpMessageProperties } from '../messages/StrongAmqpProperties.js';
import { asBuffer, asUint8Array, publishWithRetries } from '../util.js';
import { createConsumer } from './createConsumer.js';

export interface DirectExchange<Messages extends Record<string, unknown>> {
    readonly name: string;
    send<Kind extends string & keyof Messages>(kind: Kind, message: Messages[Kind]): Promise<void>;
    handle<Kind extends string & keyof Messages>(kind: Kind, handler: (message: Messages[Kind]) => Awaitable<void>, options?: HandleOptions): Promise<AsyncDisposable>;
}

export type DirectExchangeMessageOptions = Omit<Options.Publish, 'contentType' | 'contentEncoding'>;
export interface DirectExchangeConfig<Messages extends Record<string, unknown>> {
    readonly channel: Channel;
    readonly exchangeName: string;
    readonly types: { [P in keyof Messages]: z.ZodType<Messages[P], AmqpMessage> };
    readonly exchangeOptions?: Options.AssertExchange;
    readonly messageOptions?: DirectExchangeMessageOptions;
}

export interface HandleOptions {
    readonly queueId?: string;
    readonly queueOptions?: Omit<Options.AssertQueue, 'exclusive' | 'autoDelete'>;
    readonly consumeOptions?: Omit<Options.Consume, 'noAck'>;
}

export async function defineDirectExchange<Messages extends Record<string, unknown>>(config: DirectExchangeConfig<Messages>): Promise<DirectExchange<Messages>> {
    const { channel, exchangeName, types, exchangeOptions, messageOptions } = config;
    const { exchange } = await channel.assertExchange(exchangeName, 'direct', exchangeOptions);

    return {
        name: exchange,
        async send(kind, message) {
            const type = getType(kind, types);
            const { content, contentType, contentEncoding } = await type.encodeAsync(message);
            await publishWithRetries(channel, exchange, kind, asBuffer(content), {
                ...messageOptions,
                contentType,
                contentEncoding
            });
        },
        async handle(kind, handler, options) {
            const { queueId, queueOptions, consumeOptions } = options ?? {};
            const type = getType(kind, types);
            const { queue } = await channel.assertQueue(`${exchange}.${kind}.${queueId ?? randomUUID()}`, {
                ...queueOptions,
                autoDelete: queueId === undefined,
                exclusive: queueId === undefined
            });
            await channel.bindQueue(queue, exchange, kind);
            return await createConsumer(channel, queue, handleAsync, { ...consumeOptions, noAck: true });

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

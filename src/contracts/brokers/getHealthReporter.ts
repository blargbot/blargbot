import type { Channel } from 'amqplib';
import { randomUUID } from 'crypto';
import z from 'zod';

import AmqpMessage from '../messages/AmqpMessage.js';
import { HealthStatus } from '../messages/HealthStatus.js';
import { AmqpMessageProperties } from '../messages/StrongAmqpProperties.js';
import { addScopedHandler, asBuffer, asUint8Array, publishWithRetries } from '../util.js';
import { createConsumer } from './createConsumer.js';
import type { RpcQueue } from './defineRPCQueue.js';
import { defineRPCQueue } from './defineRPCQueue.js';

export interface HealthReporter {
    register(service: string, getData: () => unknown): Promise<AsyncDisposable>;
    watchAll(callback: (message: HealthStatus) => Awaitable<void>): Promise<AsyncDisposable>;
    watch(service: string, callback: (message: HealthStatus) => Awaitable<void>): Promise<AsyncDisposable>;
    ping(service: string, id: string, signal?: AbortSignal): Promise<number | 'unavailable'>;
}

export async function getHealthReporter(channel: Channel): Promise<HealthReporter> {
    const { exchange } = await channel.assertExchange('health', 'topic');

    return {
        async watch(service, callback) {
            return await watch(`health.${service}.watch.${randomUUID()}`, `${service}.*`, callback);
        },
        async watchAll(callback) {
            return await watch(`health.watch.${randomUUID()}`, '#', callback);
        },
        async ping(service, id, signal) {
            try {
                await channel.checkQueue(`health.${service}.${id}`);
            } catch {
                return 'unavailable';
            }
            await using pingQueue = await definePingQueue(channel, service, id);
            const start = performance.now();
            await pingQueue.send(undefined, signal);
            return performance.now() - start;
        },
        async register(service, getData) {
            let disposed = false;
            const id = randomUUID();
            const pingQueue = await definePingQueue(channel, service, id);
            const pingConsumer = await pingQueue.handle(() => { });
            const interval = setInterval(tick, 60 * 1000);
            const onClose = addScopedHandler(channel, 'close', () => clearInterval(interval));
            Promise.resolve().then(tick).catch(() => { });

            return {
                async [Symbol.asyncDispose]() {
                    if (disposed)
                        return;
                    clearInterval(interval);
                    disposed = true;
                    await using _1 = pingQueue;
                    await using _2 = pingConsumer;
                    using _3 = onClose;
                    tick();
                }
            };
            function tick(): void {
                if (disposed)
                    return;

                const { content, contentEncoding, contentType } = HealthStatus.encode({
                    id,
                    alive: !disposed,
                    service,
                    timestamp: Date.now(),
                    memory: process.memoryUsage(),
                    data: getData()
                });

                publishWithRetries(channel, exchange, `${service}.${id}`, asBuffer(content), {
                    contentEncoding,
                    contentType
                }).catch(() => {
                    clearInterval(interval);
                });
            }

        }
    };

    async function watch(queueId: string, binding: string, callback: (message: HealthStatus) => Awaitable<void>): Promise<AsyncDisposable> {
        const { queue } = await channel.assertQueue(queueId, { autoDelete: true, exclusive: true });
        await channel.bindQueue(queue, exchange, binding);
        return await createConsumer(channel, queue, message => {
            const { contentType, contentEncoding } = AmqpMessageProperties.decode(message.properties);
            const parsed = HealthStatus.safeDecode({
                content: asUint8Array(message.content),
                contentEncoding,
                contentType
            });
            if (parsed.success) {
                callback(parsed.data);
            }
        }, { noAck: true });
    }
}

async function definePingQueue(channel: Channel, service: string, id: string): Promise<RpcQueue<undefined, undefined>> {
    return await defineRPCQueue({
        channel,
        queueName: `health.${service}.${id}`,
        request: noContent,
        response: noContent,
        queueOptions: { autoDelete: true, exclusive: true }
    });
}

const noContent = z.codec(
    AmqpMessage,
    z.undefined(),
    {
        encode() {
            return {
                content: new Uint8Array(0),
                contentEncoding: undefined,
                contentType: undefined
            };
        },
        decode() {
            return undefined;
        }
    }
);

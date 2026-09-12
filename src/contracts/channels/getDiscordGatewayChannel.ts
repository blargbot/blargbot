import { range } from '@blargbot/util';
import { createHash } from 'crypto';

import type { AmqpChannel } from '../AmqpChannel.js';
import { DiscordGatewayEvent } from '../messages/DiscordGatewayEvent.js';
import { inferReturnType } from '../util.js';

export const getDiscordGatewayChannel = inferReturnType(async (channel: AmqpChannel) => {
    const dedupe = await channel.assertQueue('discord-gateway-events-dedupe', {
        durable: true,
        arguments: {
            'x-message-deduplication': true,
            'x-cache-size': 1000,
            'x-cache-ttl': 1000
        }
    });
    const events = await channel.assertExchange('discord-gateway-events', 'fanout', { durable: true });

    return {
        async dedupe(message: DiscordGatewayEvent, signal?: AbortSignal) {
            const payload = DiscordGatewayEvent.encode(message);
            const hash = createHash('sha1');
            hash.update(payload.content);
            await dedupe.send(payload, {
                signal,
                persistent: true,
                headers: {
                    'x-deduplication-hash': hash.digest('hex')
                }
            });
        },
        async handleDeduped(handler: (message: DiscordGatewayEvent) => Awaitable<void>) {
            return await dedupe.consume(async message => {
                const decoded = await DiscordGatewayEvent.decodeAsync(message);
                await handler(decoded);
            });
        },
        async assertPartitions(partitionCount: number) {
            if (partitionCount < 1 || partitionCount % 1 !== 0)
                throw new RangeError('Partition count must be a positive whole number');
            const digits = Math.log10(partitionCount);
            const exchange = channel.assertExchange(`discord-gateway-events.partitions(${partitionCount})`, 'x-modulus-hash', { once: true });
            await Promise.all([
                exchange.then(exchange => exchange.bind(events, '')),
                ...range(partitionCount)
                    .map(p => p.toString().padStart(digits, '0'))
                    .map(async p => {
                        const queue = await channel.assertQueue(`discord-gateway-events.partitions(${partitionCount}).${p}`, { durable: true, once: true });
                        await queue.bind(await exchange, '', { once: true });
                        return queue;
                    })
            ]);
        },
        async handlePartition(partitionCount: number, partitionId: number, handler: (message: DiscordGatewayEvent) => Awaitable<void>) {
            const queue = await channel.assertQueue(`discord-gateway-events.partitions(${partitionCount}).${partitionId}`, { durable: true });
            const consumer = await queue.consume(async message => {
                const decoded = await DiscordGatewayEvent.decodeAsync(message);
                await handler(decoded);
            });
            const cancel = consumer[Symbol.asyncDispose];
            consumer[Symbol.asyncDispose] = async () => {
                using _0 = queue;
                await cancel.call(consumer);
            };
        },
        async publish(message: DiscordGatewayEvent, key: string, signal?: AbortSignal) {
            const payload = DiscordGatewayEvent.encode(message);
            await events.send(key, payload, { signal, persistent: true });
        }
    };
});
export type DiscordGatewayChannel = Awaited<ReturnType<typeof getDiscordGatewayChannel>>;

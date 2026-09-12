import { range } from '@blargbot/util';
import { createHash } from 'crypto';

import type { AmqpChannel, AmqpExchange, AmqpQueue } from '../AmqpChannel.js';
import { DiscordGatewayDispatch } from '../messages/DiscordGatewayDispatch.js';
import { inferReturnType } from '../util.js';

export const getDiscordGatewayChannel = inferReturnType(async (channel: AmqpChannel) => {
    const dedupe = await channel.getQueue('discord-gateway-events-dedupe', {
        durable: true,
        arguments: {
            'x-message-deduplication': true,
            'x-cache-size': 1000,
            'x-cache-ttl': 1000
        }
    });
    const events = await channel.getExchange('discord-gateway-events', 'fanout', { durable: true });

    return {
        async dedupe(message: DiscordGatewayDispatch, signal?: AbortSignal) {
            const payload = DiscordGatewayDispatch.encode(message);
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
        async handleDeduped(handler: (message: DiscordGatewayDispatch) => Awaitable<void>) {
            return await dedupe.consume(async message => {
                const decoded = await DiscordGatewayDispatch.decodeAsync(message);
                await handler(decoded);
            });
        },
        async assertPartitions(partitionCount: number) {
            await getPartitionsCore(partitionCount, false);
        },
        async deletePartitions(partitionCount: number) {
            const { exchange, queues } = await getPartitionsCore(partitionCount, true);
            await Promise.all([
                exchange.delete(),
                ...queues.map(q => q.delete())
            ]);
        },
        async handlePartition(partitionCount: number, partitionId: number, handler: (message: DiscordGatewayDispatch) => Awaitable<void>) {
            const queue = await channel.getQueue(`discord-gateway-events.${getPartitionName(partitionCount, partitionId)}`, { durable: true });
            const consumer = await queue.consume(async message => {
                const decoded = await DiscordGatewayDispatch.decodeAsync(message);
                await handler(decoded);
            });
            const cancel = consumer[Symbol.asyncDispose];
            consumer[Symbol.asyncDispose] = async () => {
                using _0 = queue;
                await cancel.call(consumer);
            };
        },
        async publish(message: DiscordGatewayDispatch, key: string, signal?: AbortSignal) {
            const payload = DiscordGatewayDispatch.encode(message);
            await events.send(key, payload, { signal, persistent: true });
        }
    };

    async function getPartitionsCore(partitionCount: number, noAssert: boolean): Promise<{ exchange: AmqpExchange; queues: AmqpQueue[]; }> {
        if (partitionCount < 1 || partitionCount % 1 !== 0)
            throw new RangeError('Partition count must be a positive whole number');
        const exchange = channel.getExchange(`discord-gateway-events.${getPartitionName(partitionCount, null)}`, 'x-modulus-hash', { once: true, noAssert });
        const [_, ...queues] = await Promise.all([
            exchange.then(exchange => exchange.bind(events, '')),
            ...range(partitionCount)
                .map(async p => {
                    const queue = await channel.getQueue(`discord-gateway-events.${getPartitionName(partitionCount, p)}`, { durable: true, once: true, noAssert });
                    await queue.bind(await exchange, '', { once: true });
                    return queue;
                })
        ]);
        return { exchange: await exchange, queues };
    }
});
export type DiscordGatewayChannel = Awaited<ReturnType<typeof getDiscordGatewayChannel>>;

function getPartitionName(partitionCount: number, partitionIndex: number | null): string {
    const digits = Math.floor(Math.log10(partitionCount)) + 1;
    const id = partitionIndex?.toString().padStart(digits, '0') ?? '*'.repeat(digits);
    return `partitions(${id}/${partitionCount - 1})`;
}

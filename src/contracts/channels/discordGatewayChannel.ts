import { createHash } from 'crypto';

import type { AmqpChannel } from '../AmqpChannel.js';
import { DiscordGatewayEvent } from '../messages/DiscordGatewayEvent.js';
import { inferReturnType } from '../util.js';

export const getDiscordGatewayChannel = inferReturnType(async (channel: AmqpChannel) => {
    const exchange = await channel.assertExchange('discord-gateway-events', 'x-message-deduplication', {
        durable: true,
        arguments: {
            'x-cache-size': 1000,
            'x-cache-ttl': 1000
        }
    });

    return {
        async emit(message: DiscordGatewayEvent, signal?: AbortSignal) {
            const payload = DiscordGatewayEvent.encode(message);
            const hash = createHash('sha1');
            hash.update(payload.content);
            await exchange.send('', payload, {
                signal,
                headers: {
                    'x-deduplication-hash': hash.digest('hex')
                }
            });
        },
        async handle(queueId: string, handler: (message: DiscordGatewayEvent) => Awaitable<void>) {
            const queue = await channel.assertQueue(`discord-gateway-events.${queueId}`, { durable: true });
            await queue.bind(exchange, '');
            return await queue.consume(async message => {
                const decoded = await DiscordGatewayEvent.decodeAsync(message);
                await handler(decoded);
            });
        }
    };
});
export type DiscordGatewayChannel = Awaited<ReturnType<typeof getDiscordGatewayChannel>>;

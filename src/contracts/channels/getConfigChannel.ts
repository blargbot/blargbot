import type { AmqpChannel } from '../AmqpChannel.js';
import { StringMessage } from '../messages/StringMessage.js';
import { inferReturnType } from '../util.js';
import { amqpChannelHelper } from './channelMethods.js';

export const getConfigChannel = inferReturnType(async (channel: AmqpChannel) => {
    const exchange = await channel.assertExchange('config', 'direct');

    const x = amqpChannelHelper.onExchange(channel, exchange);
    return amqpChannelHelper.merge(
        x.defineNotification({
            routingKey: 'set-discord-token',
            send: 'setDiscordToken',
            handle: 'handleSetDiscordToken',
            encoder: StringMessage
        })
    );
});
export type ConfigChannel = Awaited<ReturnType<typeof getConfigChannel>>;

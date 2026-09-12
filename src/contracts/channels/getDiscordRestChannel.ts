import z from 'zod';

import type { AmqpChannel } from '../AmqpChannel.js';
import { DiscordRequest } from '../messages/DiscordRequest.js';
import { DiscordResponse } from '../messages/DiscordResponse.js';
import { inferReturnType } from '../util.js';
import { amqpChannelHelper } from './channelMethods.js';

export const getDiscordRestChannel = inferReturnType(async (channel: AmqpChannel) => {
    const queue = await channel.getQueue('discord-rest-requests');
    return amqpChannelHelper.onQueue(channel, queue).defineRequest({
        send: 'send',
        handle: 'handle',
        requestEncoder: DiscordRequest,
        responseEncoder: DiscordResponse,
        badRequest(error) {
            if (!(error instanceof z.ZodError)) throw error;

            return {
                status: 400,
                statusText: 'BadRequest',
                body: {
                    ok: false,
                    body: error.issues,
                    error: error.message
                }
            };
        }
    });
});
export type DiscordRestChannel = Awaited<ReturnType<typeof getDiscordRestChannel>>;

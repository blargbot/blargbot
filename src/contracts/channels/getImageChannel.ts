import type { AmqpChannel } from '../AmqpChannel.js';
import { ImageRequest } from '../messages/ImageRequest.js';
import { ImageResponse } from '../messages/ImageResponse.js';
import { inferReturnType } from '../util.js';
import { amqpChannelHelper } from './channelMethods.js';

export const getImageChannel = inferReturnType(async (channel: AmqpChannel) => {
    const queue = await channel.getQueue('image-requests');
    return amqpChannelHelper.onQueue(channel, queue).defineRequest({
        send: 'render',
        handle: 'handle',
        requestEncoder: ImageRequest,
        responseEncoder: ImageResponse
    });
});
export type ImageChannel = Awaited<ReturnType<typeof getImageChannel>>;

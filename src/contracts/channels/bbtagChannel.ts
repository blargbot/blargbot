import type { AmqpChannel } from '../AmqpChannel.js';
import { ExecuteBBTagRequest } from '../messages/ExecuteBBTagRequest.js';
import { ExecuteBBTagResponse } from '../messages/ExecuteBBTagResponse.js';
import { ResumeBBTagMessage } from '../messages/ResumeBBTagMessage.js';
import { SuspendBBTagMessage } from '../messages/SuspendBBTagMessage.js';
import { inferReturnType } from '../util.js';
import { amqpChannelHelper } from './channelMethods.js';

export const getBBTagChannel = inferReturnType(async (channel: AmqpChannel) => {
    const executeQueue = await channel.getQueue('bbtag-requests');
    const suspendQueue = await channel.getQueue('bbtag-suspend')
    const resumeQueue = await channel.getQueue('bbtag-resume')
    return amqpChannelHelper.merge(
        amqpChannelHelper.onQueue(channel, executeQueue).defineRequest({
            send: 'execute',
            handle: 'handleExecute',
            requestEncoder: ExecuteBBTagRequest,
            responseEncoder: ExecuteBBTagResponse
        }),
        amqpChannelHelper.onQueue(channel, suspendQueue).defineNotification({
            send: 'suspend',
            handle: 'handleSuspend',
            encoder: SuspendBBTagMessage
        }),
        amqpChannelHelper.onQueue(channel, resumeQueue).defineNotification({
            send: 'resume',
            handle: 'handleResume',
            encoder: ResumeBBTagMessage
        }),
    )
});
export type BBTagChannel = Awaited<ReturnType<typeof getBBTagChannel>>;

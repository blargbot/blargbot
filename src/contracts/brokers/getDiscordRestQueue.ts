import type { Channel } from 'amqplib';

import DiscordRequest from '../messages/DiscordRequest.js';
import DiscordResponse from '../messages/DiscordResponse.js';
import type { RpcQueue } from './defineRPCQueue.js';
import { defineRPCQueue } from './defineRPCQueue.js';

export interface DiscordRequestHandlerOptions {
    readonly catch?: (error: unknown) => DiscordResponse;
    readonly signal?: AbortSignal;
}

export type DiscordRestQueue = RpcQueue<DiscordRequest, DiscordResponse>;

export async function getDiscordRestQueue(channel: Channel): Promise<DiscordRestQueue> {
    return await defineRPCQueue({
        channel,
        queueName: 'discord-rest-requests',
        request: DiscordRequest,
        response: DiscordResponse
    });
}

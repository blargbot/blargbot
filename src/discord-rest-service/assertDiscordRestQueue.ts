import type { Channel, Replies } from 'amqplib';

export async function assertDiscordRestQueue(channel: Channel): Promise<Replies.AssertQueue> {
    return await channel.assertQueue('discord-rest-requests', {});
}

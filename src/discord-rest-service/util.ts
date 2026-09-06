import type { Logger } from '@blargbot/logger';
import type { Channel, ChannelModel } from 'amqplib';

export async function createAbortableChannel(amqp: ChannelModel, signal: AbortSignal, logger: Logger): Promise<Channel> {
    const channel = await amqp.createChannel();
    signal.addEventListener('abort', () => void channel.close().catch(err => logger.error('Error while closing channel', err)));
    return channel;
}

import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { Message, PartialMessage } from 'discord.js';

export class DiscordMessageUpdateHandler extends DiscordEventService<'messageUpdate'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageUpdate', cluster.logger);
    }

    public async execute(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
        await Promise.all([
            this.cluster.moderation.eventLog.messageUpdated(newMessage, oldMessage),
            this.cluster.moderation.chatLog.messageUpdated(newMessage)
        ]);
    }
}

import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { Message, PartialMessage } from 'discord.js';

export class DiscordMessageDeleteHandler extends DiscordEventService<'messageDelete'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageDelete', cluster.logger);
    }

    protected async execute(message: Message | PartialMessage): Promise<void> {
        await Promise.all([
            this.cluster.commands.messageDeleted(message),
            this.cluster.moderation.eventLog.messageDeleted(message),
            this.cluster.moderation.chatLog.messageDeleted(message)
        ]);
    }
}

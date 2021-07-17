import { PossiblyUncachedMessage } from 'eris';
import { Cluster } from '../Cluster';
import { DiscordEventService } from '@cluster/core';

export class DiscordMessageDeleteHandler extends DiscordEventService<'messageDelete'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageDelete', cluster.logger);
    }

    protected async execute(message: PossiblyUncachedMessage): Promise<void> {
        await Promise.all([
            this.cluster.commands.messageDeleted(message),
            this.cluster.moderation.eventLog.messageDeleted(message),
            this.cluster.moderation.chatLog.messageDeleted(message)
        ]);
    }
}

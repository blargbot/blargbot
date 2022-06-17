import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes';

export class DiscordMessageUpdateHandler extends DiscordEventService<'messageUpdate'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageUpdate', cluster.logger, async (message, oldMessage) => {
            await Promise.all([
                this.cluster.moderation.eventLog.messageUpdated(message, oldMessage),
                this.cluster.moderation.chatLog.messageUpdated(message)
            ]);
        });
    }
}

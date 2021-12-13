import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';

export class DiscordMessageDeleteHandler extends DiscordEventService<'messageDelete'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageDelete', cluster.logger, async (message) => {
            await Promise.all([
                this.cluster.commands.messageDeleted(message),
                this.cluster.moderation.eventLog.messageDeleted(message),
                this.cluster.moderation.chatLog.messageDeleted(message)
            ]);
        });
    }
}

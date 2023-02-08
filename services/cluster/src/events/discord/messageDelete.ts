import type { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';

export class DiscordMessageDeleteHandler extends DiscordEventService<'messageDelete'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageDelete', cluster.logger, async (message) => {
            await Promise.all([
                this.cluster.commands.messageDeleted(message),
                this.cluster.moderation.eventLog.messageDeleted(message)
            ]);
        });
    }
}

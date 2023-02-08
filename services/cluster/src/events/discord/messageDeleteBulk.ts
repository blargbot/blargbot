import type { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';

export class DiscordMessageDeleteBulkHandler extends DiscordEventService<'messageDeleteBulk'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageDeleteBulk', cluster.logger, async (messages) => {
            await Promise.all([
                ...messages.map(message => this.cluster.commands.messageDeleted(message)).flat(),
                this.cluster.moderation.eventLog.messagesDeleted(messages.map(m => m))
            ]);
        });
    }
}

import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';

export class DiscordMessageDeleteBulkHandler extends DiscordEventService<'messageDeleteBulk'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageDeleteBulk', cluster.logger, async (messages) => {
            await Promise.all([
                ...messages.map(message => [
                    this.cluster.commands.messageDeleted(message),
                    this.cluster.moderation.chatLog.messageDeleted(message)
                ]).flat(),
                this.cluster.moderation.eventLog.messagesDeleted(messages.map(m => m))
            ]);
        });
    }
}

import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { PossiblyUncachedMessage } from 'eris';

export class DiscordMessageDeleteBulkHandler extends DiscordEventService<'messageDeleteBulk'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageDeleteBulk', cluster.logger);
    }

    protected async execute(messages: PossiblyUncachedMessage[]): Promise<void> {
        await Promise.all([
            ...messages.flatMap(message => [
                this.cluster.commands.messageDeleted(message),
                this.cluster.moderation.chatLog.messageDeleted(message)
            ]),
            this.cluster.moderation.eventLog.messagesDeleted(messages)
        ]);
    }
}

import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { Message, OldMessage } from 'eris';

export class DiscordMessageUpdateHandler extends DiscordEventService<'messageUpdate'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageUpdate', cluster.logger);
    }

    protected async execute(message: Message, oldMessage: OldMessage | null): Promise<void> {
        await Promise.all([
            this.cluster.moderation.eventLog.messageUpdated(message, oldMessage),
            this.cluster.moderation.chatLog.messageUpdated(message)
        ]);
    }
}

import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';
import { MessageFlags, MessageType } from 'discord-api-types/v9';
import Eris from 'eris';

const reemitMessageTypes = new Set([
    MessageType.ChatInputCommand,
    MessageType.ContextMenuCommand
]);

export class DiscordMessageUpdateHandler extends DiscordEventService<'messageUpdate'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageUpdate', cluster.logger, (m, o) => this.execute(m, o));
    }

    public async execute(message: Eris.Message<Eris.PossiblyUncachedTextableChannel>, oldMessage: Eris.OldMessage | null): Promise<void> {
        if (message.editedTimestamp !== undefined) {
            await Promise.all([
                this.cluster.moderation.censors.censor(message),
                this.cluster.moderation.eventLog.messageUpdated(message, oldMessage),
                this.cluster.moderation.chatLog.messageUpdated(message)
            ]);
        } else if (oldMessage !== null && message.embeds.filter(e => e.type !== 'rich').length > oldMessage.embeds.filter(e => e.type !== 'rich').length) {
            // This was just links getting embedded, no need to do anything here.
        } else if (reemitMessageTypes.has(message.type) && (message.flags & MessageFlags.Loading) === 0) {
            // The response was a deferred response, we should process this as a brand new message
            this.cluster.discord.emit('messageCreate', message);
        }
    }
}

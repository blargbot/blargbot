import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { Interaction, Message, PartialMessage } from 'discord.js';

export class DiscordMessageDeleteHandler extends DiscordEventService<'messageDelete'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageDelete', cluster.logger);
    }

    public async execute(message: Message | PartialMessage): Promise<void> {
        await Promise.all([
            this.cluster.commands.messageDeleted(message),
            this.cluster.moderation.eventLog.messageDeleted(message),
            this.cluster.moderation.chatLog.messageDeleted(message)
        ]);
    }
}

export class DiscordInteractionCreateHandler extends DiscordEventService<'interactionCreate'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'interactionCreate', cluster.logger);
    }

    public async execute(interaction: Interaction): Promise<void> {
        if (interaction.isMessageComponent())
            await this.cluster.awaiter.components.tryConsume(interaction);
    }
}

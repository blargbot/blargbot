import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes';
import { ComponentInteraction, KnownInteraction } from 'eris';

export class DiscordInteractionCreateHandler extends DiscordEventService<'interactionCreate'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'interactionCreate', cluster.logger, (interaction) => this.execute(interaction));
    }

    public async execute(interaction: KnownInteraction): Promise<void> {
        if (interaction instanceof ComponentInteraction)
            await this.cluster.awaiter.components.tryConsume(interaction);
    }
}

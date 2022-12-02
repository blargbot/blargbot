import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';
import * as Eris from 'eris';

export class DiscordInteractionCreateHandler extends DiscordEventService<'interactionCreate'> {
    public constructor(
        protected readonly cluster: Cluster
    ) {
        super(cluster.discord, 'interactionCreate', cluster.logger, (interaction) => this.execute(interaction));
    }

    public async execute(interaction: Eris.KnownInteraction): Promise<void> {
        if (interaction instanceof Eris.ComponentInteraction)
            await this.cluster.awaiter.components.tryConsume(interaction);
    }
}

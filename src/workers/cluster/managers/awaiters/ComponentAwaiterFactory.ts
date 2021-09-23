import { Logger } from '@core/Logger';
import { MessageComponentInteraction } from 'discord.js';

import { AwaiterFactoryBase } from './AwaiterFactoryBase';

export class ComponentAwaiterFactory extends AwaiterFactoryBase<MessageComponentInteraction> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(interaction: MessageComponentInteraction): string {
        return interaction.customId;
    }
}

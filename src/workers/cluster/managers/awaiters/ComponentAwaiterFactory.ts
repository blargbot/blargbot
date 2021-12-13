import { Logger } from '@core/Logger';
import { ComponentInteraction } from 'eris';

import { AwaiterFactoryBase } from './AwaiterFactoryBase';

export class ComponentAwaiterFactory extends AwaiterFactoryBase<ComponentInteraction> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(interaction: ComponentInteraction): string {
        return interaction.data.custom_id;
    }
}

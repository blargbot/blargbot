import { Logger } from '@blargbot/logger';
import * as Eris from 'eris';

import { AwaiterFactoryBase } from './AwaiterFactoryBase.js';

export class ComponentAwaiterFactory extends AwaiterFactoryBase<Eris.ComponentInteraction> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(interaction: Eris.ComponentInteraction): string {
        return interaction.data.custom_id;
    }
}

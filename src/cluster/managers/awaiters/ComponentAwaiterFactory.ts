import type { Logger } from '@blargbot/logger';
import type eris from 'eris';

import { AwaiterFactoryBase } from './AwaiterFactoryBase.js';

export class ComponentAwaiterFactory extends AwaiterFactoryBase<eris.ComponentInteraction> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(interaction: eris.ComponentInteraction): string {
        return interaction.data.custom_id;
    }
}

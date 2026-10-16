import type { ReactionEvent } from '@blargbot/bbtag';
import type { Logger } from '@blargbot/logger';

import { AwaiterFactoryBase } from './AwaiterFactoryBase.js';

export class ReactionAwaiterFactory extends AwaiterFactoryBase<ReactionEvent> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(response: ReactionEvent): string {
        return response.message.id;
    }
}

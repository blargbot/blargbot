import type { AwaitReactionsResponse } from '@blargbot/bbtag';
import type { Logger } from '@blargbot/logger';

import { AwaiterFactoryBase } from './AwaiterFactoryBase.js';

export class ReactionAwaiterFactory extends AwaiterFactoryBase<AwaitReactionsResponse> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(response: AwaitReactionsResponse): string {
        return response.message.id;
    }
}
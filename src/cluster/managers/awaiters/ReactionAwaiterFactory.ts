import { AwaitReactionsResponse } from '@blargbot/cluster/types';
import { Logger } from '@blargbot/logger';

import { AwaiterFactoryBase } from './AwaiterFactoryBase';

export class ReactionAwaiterFactory extends AwaiterFactoryBase<AwaitReactionsResponse> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(response: AwaitReactionsResponse): string {
        return response.message.id;
    }
}

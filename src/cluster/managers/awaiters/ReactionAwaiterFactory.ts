import { AwaitReactionsResponse } from '@cluster/types';
import { Logger } from '@core/Logger';

import { AwaiterFactoryBase } from './AwaiterFactoryBase';

export class ReactionAwaiterFactory extends AwaiterFactoryBase<AwaitReactionsResponse> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(response: AwaitReactionsResponse): string {
        return response.message.id;
    }
}

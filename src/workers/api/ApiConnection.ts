import { Logger } from '@core/Logger';
import { WorkerConnection } from '@core/worker';

import { ApiIPCContracts } from './types';

export class ApiConnection extends WorkerConnection<'api', ApiIPCContracts> {
    public constructor(id: number, logger: Logger) {
        super(id, 'api', logger);
    }
}

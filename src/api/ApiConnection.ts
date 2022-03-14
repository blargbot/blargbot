import { Logger } from '@blargbot/core/Logger';
import { WorkerConnection } from '@blargbot/core/worker';

import { ApiIPCContracts } from './types';

export class ApiConnection extends WorkerConnection<'@blargbot/api', ApiIPCContracts> {
    public constructor(id: number, logger: Logger) {
        super(id, '@blargbot/api', logger);
    }
}

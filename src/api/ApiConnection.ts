import { WorkerConnection } from '@blargbot/core/worker';
import { Logger } from '@blargbot/logger';

import { ApiIPCContracts } from './types';

export class ApiConnection extends WorkerConnection<ApiIPCContracts> {
    public constructor(id: number, logger: Logger) {
        super(id, '@blargbot/api', require.resolve('@blargbot/api/start'), logger);
    }
}

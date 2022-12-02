import { WorkerConnection } from '@blargbot/core/worker/index.js';
import { Logger } from '@blargbot/logger';

import { entrypoint } from './index.js';
import { ApiIPCContracts } from './types.js';

export class ApiConnection extends WorkerConnection<ApiIPCContracts> {
    public constructor(id: number, logger: Logger) {
        super(id, '@blargbot/api', entrypoint, logger);
    }
}

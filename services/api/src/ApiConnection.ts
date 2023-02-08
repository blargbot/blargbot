import { WorkerConnection } from '@blargbot/core/worker/index.js';
import type { Logger } from '@blargbot/logger';

import { entrypoint } from './index.js';
import type { ApiIPCContracts } from './types.js';

export class ApiConnection extends WorkerConnection<ApiIPCContracts> {
    public constructor(id: number, logger: Logger) {
        super(id, '@blargbot/api', entrypoint, logger);
    }
}

import { WorkerConnection } from '@blargbot/core/worker/index.js';
import type { Logger } from '@blargbot/logger';

import type { ApiIPCContracts } from './types.js';

export class ApiConnection extends WorkerConnection<ApiIPCContracts> {
    public constructor(id: number, logger: Logger) {
        super(id, '@blargbot/api', import.meta.resolve('./start.js'), logger);
    }
}

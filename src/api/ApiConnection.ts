import { fileURLToPath } from 'node:url';

import { WorkerConnection } from '@blargbot/core';
import type { Logger } from '@blargbot/logger';

import type { ApiIPCContracts } from './types.js';

export class ApiConnection extends WorkerConnection<ApiIPCContracts> {
    public constructor(id: number, logger: Logger) {
        super(id, '@blargbot/api', fileURLToPath(import.meta.resolve('./start.js')), logger);
    }
}

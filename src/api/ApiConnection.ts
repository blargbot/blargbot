import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { WorkerConnection } from '@blargbot/core/worker/index.js';
import type { Logger } from '@blargbot/logger';

import type { ApiIPCContracts } from './types.js';

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);

export class ApiConnection extends WorkerConnection<ApiIPCContracts> {
    public constructor(id: number, logger: Logger) {
        super(id, '@blargbot/api', path.join(thisDir, 'start.js'), logger);
    }
}

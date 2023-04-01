import { fileURLToPath } from 'node:url';

import { ApiWorker } from '@blargbot/api/ApiWorker.js';
import { host, isEntrypoint, ServiceHost } from '@blargbot/application';
import type { Configuration } from '@blargbot/config';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';

export * from './ApiPool.js';
export * from './ApiConnection.js';
export * from './ApiWorker.js';
export * from './Api.js';
export const entrypoint = fileURLToPath(import.meta.url);

export class ClusterApp extends ServiceHost {
    public constructor(config: Configuration) {
        super([
            new ApiWorker(
                config,
                createLogger(config, `API${process.env.WORKER_ID ?? ''}`)
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new ClusterApp(config));
}

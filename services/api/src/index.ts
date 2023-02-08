import { fileURLToPath } from 'node:url';

import { ApiWorker } from '@blargbot/api/ApiWorker.js';
import Application from '@blargbot/application';
import type { Configuration } from '@blargbot/config';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';

export * from './ApiPool.js';
export * from './ApiConnection.js';
export * from './ApiWorker.js';
export * from './Api.js';
export const entrypoint = fileURLToPath(import.meta.url);

@Application.hostIfEntrypoint(() => [config])
export class ClusterApp extends Application {
    public readonly worker: ApiWorker;

    public constructor(config: Configuration) {
        super();
        this.worker = new ApiWorker(
            config,
            createLogger(config, `API${process.env.WORKER_ID ?? ''}`)
        );
    }

    protected override async start(): Promise<void> {
        await this.worker.start();
    }

    protected override async stop(): Promise<void> {
        await this.worker.stop();
    }
}

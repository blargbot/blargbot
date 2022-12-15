import { fileURLToPath } from 'node:url';

import Application from '@blargbot/application';
import { ClusterWorker } from '@blargbot/cluster';
import type { Configuration } from '@blargbot/config';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';

export * from './Cluster.js';
export * from './ClusterConnection.js';
export * from './ClusterPool.js';
export * from './ClusterUtilities.js';
export * from './ClusterWorker.js';
export const entrypoint = fileURLToPath(import.meta.url);

@Application.hostIfEntrypoint(() => [config])
export class ClusterApp extends Application {
    public readonly worker: ClusterWorker;

    public constructor(config: Configuration) {
        super();
        this.worker = new ClusterWorker(
            createLogger(config, `CL${process.env.CLUSTER_ID ?? '??'}`),
            config
        );
    }

    protected override async start(): Promise<void> {
        await this.worker.start();
    }

    protected override async stop(): Promise<void> {
        await this.worker.stop();
    }
}

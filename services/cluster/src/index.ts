import { fileURLToPath } from 'node:url';

import { host, isEntrypoint, ServiceHost } from '@blargbot/application';
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

export class ClusterApp extends ServiceHost {
    public constructor(config: Configuration) {
        super([
            new ClusterWorker(
                createLogger(config, `CL${process.env.CLUSTER_ID ?? '??'}`),
                config
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new ClusterApp(config));
}

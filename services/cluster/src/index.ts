import { ClusterWorker } from '@blargbot/cluster';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';
import path from 'path';
import { fileURLToPath } from 'url';

export * from './Cluster.js';
export * from './ClusterConnection.js';
export * from './ClusterPool.js';
export * from './ClusterUtilities.js';
export * from './ClusterWorker.js';
export const entrypoint = path.join(fileURLToPath(import.meta.url), '../start.js');

export async function start(): Promise<void> {
    Error.stackTraceLimit = 100;
    const logger = createLogger(config, `CL${process.env.CLUSTER_ID ?? '??'}`);
    logger.setGlobal();

    await new ClusterWorker(logger, config)
        .start();
}

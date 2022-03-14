import { ClusterWorker } from '@blargbot/cluster';
import { createLogger } from '@blargbot/core/Logger';

export * from './Cluster';
export * from './ClusterConnection';
export * from './ClusterPool';
export * from './ClusterUtilities';
export * from './ClusterWorker';

export default async function start(): Promise<void> {
    const { config } = await import('@blargbot/config');
    const logger = createLogger(config, `CL${process.env.CLUSTER_ID ?? '??'}`);
    logger.setGlobal();

    await new ClusterWorker(process, logger, config)
        .start();
}

if (require.main === module) {
    Error.stackTraceLimit = 100;
    void start();
}

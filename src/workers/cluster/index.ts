import 'module-alias/register';

import { ClusterWorker } from '@cluster';
import config from '@config';
import { createLogger } from '@core/Logger';

export * from './Cluster';
export * from './ClusterConnection';
export * from './ClusterPool';
export * from './ClusterUtilities';
export * from './ClusterWorker';

export default async function start(): Promise<void> {
    const logger = createLogger(config, `CL${process.env.CLUSTER_ID ?? '??'}(${process.pid})`);
    logger.setGlobal();

    await new ClusterWorker(process, logger, config)
        .start();
}

if (require.main === module)
    void start();

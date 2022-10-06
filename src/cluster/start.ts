import { ClusterWorker } from '@blargbot/cluster';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';

Error.stackTraceLimit = 100;
const logger = createLogger(config, `CL${process.env.CLUSTER_ID ?? `??`}`);
logger.setGlobal();

void new ClusterWorker(logger, config)
    .start();

import config from '../../config.json';
import { createLogger } from '../core/Logger';
import { ClusterWorker } from '../workers/ClusterWorker';

const logger = createLogger(config, `CL${process.env.CLUSTER_ID ?? '??'}(${process.pid})`);
logger.setGlobal();

void new ClusterWorker(logger, config)
    .start();
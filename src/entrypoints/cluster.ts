import config from '../../config.json';
import { createLogger } from '../core';
import { ClusterWorker } from '../workers/cluster/ClusterWorker';

const logger = createLogger(config, `CL${process.env.CLUSTER_ID ?? '??'}(${process.pid})`);
logger.setGlobal();

void new ClusterWorker(logger, config).start();

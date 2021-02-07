import config from '../../config.json';
import { createLogger } from '../workers/Logger';
import { ClusterWorker } from '../workers/ClusterWorker';

const logger = createLogger(config, `CL${process.env.CLUSTER_ID ?? '??'}`);
const worker = new ClusterWorker(logger, config);

logger.setGlobal();
void worker.start();
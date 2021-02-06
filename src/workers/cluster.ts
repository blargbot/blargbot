import config from "../../config.json";
import { createLogger } from './Logger';
import { ClusterWorker } from './cluster/ClusterWorker';

const logger = createLogger(config, 'CL' + process.env.CLUSTER_ID);
const worker = new ClusterWorker(process, logger, config);

logger.setGlobal();
worker.start();
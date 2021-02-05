import config from "../../config.json";
import { createLogger } from './cluster/Logger';
import { ClusterWorker } from './cluster/ClusterWorker';

const logger = createLogger(config, process.env.CLUSTER_ID!);
const worker = new ClusterWorker(process, logger, config);

logger.setGlobal();
worker.start();
import 'module-alias/register';

import { ClusterWorker } from '@cluster';
import config from '@config';
import { createLogger } from '@core/Logger';

const logger = createLogger(config, `CL${process.env.CLUSTER_ID ?? '??'}(${process.pid})`);
logger.setGlobal();

void new ClusterWorker(logger, config).start();

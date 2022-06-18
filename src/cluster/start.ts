import 'sharp'; // needed as otheriwise it takes ~40s where its actually needed? very strange

import { ClusterWorker } from '@blargbot/cluster';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';

Error.stackTraceLimit = 100;
const logger = createLogger(config, `CL${process.env.CLUSTER_ID ?? '??'}`);
logger.setGlobal();

logger.warn('aaaaaaaaaa');

void new ClusterWorker(logger, config)
    .start();

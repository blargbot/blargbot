import config from '../../config.json';
import { ImageWorker } from '../workers/ImageWorker';
import { createLogger } from '../core/Logger';

const logger = createLogger(config, 'IM' + (process.env.CLUSTER_ID ?? ''));
logger.setGlobal();

void new ImageWorker(logger)
    .start();
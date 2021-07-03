import config from '../../config.json';
import { createLogger } from '../core';
import { ImageWorker } from '../workers/image/ImageWorker';

const logger = createLogger(config, `IM${process.env.CLUSTER_ID ?? ''}(${process.pid})`);
logger.setGlobal();

void new ImageWorker(logger).start();

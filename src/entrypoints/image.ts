import 'module-alias/register';
import config from '~/config.json';
import { createLogger } from '@core';
import { ImageWorker } from '@image';

const logger = createLogger(config, `IM${process.env.CLUSTER_ID ?? ''}(${process.pid})`);
logger.setGlobal();

void new ImageWorker(logger).start();

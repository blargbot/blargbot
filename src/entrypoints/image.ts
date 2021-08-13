import 'module-alias/register';

import config from '@config';
import { createLogger } from '@core/Logger';
import { ImageWorker } from '@image/ImageWorker';

const logger = createLogger(config, `IM${process.env.IMAGE_ID ?? ''}(${process.pid})`);
logger.setGlobal();

void new ImageWorker(config, logger).start();

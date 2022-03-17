import { config } from '@blargbot/config';
import { ImageWorker } from '@blargbot/image/ImageWorker';
import { createLogger } from '@blargbot/logger';

Error.stackTraceLimit = 100;
const logger = createLogger(config, `IM${process.env.IMAGE_ID ?? ''}`);
logger.setGlobal();

void new ImageWorker(process, config, logger)
    .start();

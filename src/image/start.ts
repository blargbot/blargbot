import { config } from '@blargbot/config';
import { ImageWorker } from '@blargbot/image/ImageWorker.js';
import { createLogger } from '@blargbot/logger';

Error.stackTraceLimit = 100;
const logger = createLogger(config, `IM${process.env.IMAGE_ID ?? ''}`);
logger.setGlobal();

await new ImageWorker(config, logger, fetch)
    .start();

import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/core/Logger';
import { ImageWorker } from '@blargbot/image/ImageWorker';

Error.stackTraceLimit = 100;
const logger = createLogger(config, `IM${process.env.IMAGE_ID ?? ''}`);
logger.setGlobal();

void new ImageWorker(process, config, logger)
    .start();

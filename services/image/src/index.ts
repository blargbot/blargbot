import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from '@blargbot/config';
import { ImageWorker } from '@blargbot/image/ImageWorker.js';
import { createLogger } from '@blargbot/logger';

export * from './ImageConnection.js';
export * from './ImagePool.js';
export const entrypoint = path.join(fileURLToPath(import.meta.url), '../start.js');

export async function start(): Promise<void> {
    Error.stackTraceLimit = 100;
    const logger = createLogger(config, `IM${process.env.IMAGE_ID ?? ''}`);
    logger.setGlobal();

    await new ImageWorker(config, logger)
        .start();
}

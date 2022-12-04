import { fileURLToPath } from 'node:url';

import { isEntrypoint } from '@blargbot/application';
import { config } from '@blargbot/config';
import { ImageWorker } from '@blargbot/image/ImageWorker.js';
import { createLogger } from '@blargbot/logger';

export * from './ImageConnection.js';
export * from './ImagePool.js';
export const entrypoint = fileURLToPath(import.meta.url);

export async function start(): Promise<void> {
    Error.stackTraceLimit = 100;
    const logger = createLogger(config, `IM${process.env.IMAGE_ID ?? ''}`);
    logger.setGlobal();

    await new ImageWorker(config, logger)
        .start();
}

if (isEntrypoint(import.meta))
    await start();

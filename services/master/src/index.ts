import { fileURLToPath } from 'node:url';

import { isEntrypoint } from '@blargbot/application';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';
import { MasterWorker } from '@blargbot/master';
import res from '@blargbot/res';

export * from './Master.js';
export * from './MasterWorker.js';
export const entrypoint = fileURLToPath(import.meta.url);

export async function start(): Promise<void> {
    const logger = createLogger(config, 'MS');
    logger.setGlobal();

    const avatars = config.general.isProd !== true
        ? await res.avatars.dev.load()
        : await res.avatars.prd.load();

    Error.stackTraceLimit = 100;
    await new MasterWorker(logger, config, { avatars })
        .start();
}

if (isEntrypoint(import.meta))
    await start();

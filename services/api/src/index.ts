import { fileURLToPath } from 'node:url';

import { ApiWorker } from '@blargbot/api/ApiWorker.js';
import Application from '@blargbot/application';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';

export * from './ApiPool.js';
export * from './ApiConnection.js';
export * from './ApiWorker.js';
export * from './Api.js';
export const entrypoint = fileURLToPath(import.meta.url);

await Application.bootstrapIfEntrypoint(start);
export async function start(): Promise<void> {
    Error.stackTraceLimit = 100;
    const logger = createLogger(config, `API${process.env.WORKER_ID ?? ''}`);
    logger.setGlobal();

    await new ApiWorker(config, logger).start();
}

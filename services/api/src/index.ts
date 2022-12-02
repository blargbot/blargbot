import { ApiWorker } from '@blargbot/api/ApiWorker.js';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';
import path from 'path';
import { fileURLToPath } from 'url';

export * from './ApiPool.js';
export * from './ApiConnection.js';
export * from './ApiWorker.js';
export * from './Api.js';
export const entrypoint = path.join(fileURLToPath(import.meta.url), '../start.js');

export async function start(): Promise<void> {
    Error.stackTraceLimit = 100;
    const logger = createLogger(config, `API${process.env.WORKER_ID ?? ''}`);
    logger.setGlobal();

    await new ApiWorker(config, logger).start();
}

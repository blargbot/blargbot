import 'module-alias/register';

import { createLogger } from '@core/Logger';
import { ApiWorker } from '@workers/api/ApiWorker';

export * from './ApiPool';
export * from './ApiConnection';
export * from './ApiWorker';
export * from './Api';

export default async function start(): Promise<void> {
    const config = await import('@config');
    const logger = createLogger(config, `API${process.env.WORKER_ID ?? ''}`);
    logger.setGlobal();

    await new ApiWorker(process, config, logger)
        .start();
}

if (require.main === module) {
    Error.stackTraceLimit = 100;
    void start();
}
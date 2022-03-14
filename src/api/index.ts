import 'module-alias/register';

import { ApiWorker } from '@blargbot/api/ApiWorker';
import { createLogger } from '@blargbot/core/Logger';

export * from './ApiPool';
export * from './ApiConnection';
export * from './ApiWorker';
export * from './Api';

export default async function start(): Promise<void> {
    const config = await import('@blargbot/config');
    const logger = createLogger(config, `API${process.env.WORKER_ID ?? ''}`);
    logger.setGlobal();

    await new ApiWorker(process, config, logger)
        .start();
}

if (require.main === module) {
    Error.stackTraceLimit = 100;
    void start();
}

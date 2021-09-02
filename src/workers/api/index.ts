import 'module-alias/register';

import config from '@config';
import { createLogger } from '@core/Logger';
import { ApiWorker } from '@workers/api/ApiWorker';

export * from './ApiPool';
export * from './ApiConnection';
export * from './ApiWorker';
export * from './Api';

export default async function start(): Promise<void> {
    const logger = createLogger(config, `API${process.env.WORKER_ID ?? ''}(${process.pid})`);
    logger.setGlobal();

    await new ApiWorker(config, logger)
        .start();
}

if (require.main === module)
    void start();

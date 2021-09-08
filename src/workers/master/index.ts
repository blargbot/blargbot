import 'module-alias/register';

import config from '@config';
import { createLogger } from '@core/Logger';
import { MasterWorker } from '@master';
import avatars from '@res/avatars.json';
import holidays from '@res/holidays.json';

export * from './Master';
export * from './MasterWorker';

export default async function start(): Promise<void> {
    const logger = createLogger(config, 'MS');
    logger.setGlobal();

    await new MasterWorker(process, logger, config, { avatars, holidays })
        .start();
}

if (require.main === module) {
    Error.stackTraceLimit = 100;
    void start();
}

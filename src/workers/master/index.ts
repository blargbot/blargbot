import 'module-alias/register';

import config from '@config';
import { createLogger } from '@core/Logger';
import { MasterWorker } from '@master';
import avatars from '@res/avatars.json';
import holidays from '@res/holidays.json';

export * from './Master';
export * from './MasterWorker';

export default async function start(): Promise<void> {
    const logger = createLogger(config, `MS (${process.pid})`);
    logger.setGlobal();

    await new MasterWorker(logger, config, { avatars, holidays })
        .start();
}

if (require.main === module)
    void start();

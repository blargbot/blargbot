import { createLogger } from '@blargbot/core/Logger';
import { MasterWorker } from '@blargbot/master';
import avatars from '@blargbot/res/avatars.json';
import holidays from '@blargbot/res/holidays.json';

export * from './Master';
export * from './MasterWorker';

export default async function start(): Promise<void> {
    const { config } = await import('@blargbot/config');
    const logger = createLogger(config, 'MS');
    logger.setGlobal();

    await new MasterWorker(process, logger, config, { avatars, holidays })
        .start();
}

if (require.main === module) {
    Error.stackTraceLimit = 100;
    void start();
}

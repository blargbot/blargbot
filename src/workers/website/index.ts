import 'module-alias/register';

import config from '@config';
import { createLogger } from '@core/Logger';
import { WebsiteWorker } from '@website/WebsiteWorker';

export * from './WebsitePool';
export * from './WebsiteConnection';
export * from './WebsiteWorker';
export * from './Website';

export default async function start(): Promise<void> {
    const logger = createLogger(config, `IM${process.env.IMAGE_ID ?? ''}(${process.pid})`);
    logger.setGlobal();

    await new WebsiteWorker(config, logger)
        .start();
}

if (require.main === module)
    void start();

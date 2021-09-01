import 'module-alias/register';

import config from '@config';
import { createLogger } from '@core/Logger';
import { ImageWorker } from '@image/ImageWorker';

export * from './ImageConnection';
export * from './ImagePool';

export default async function start(): Promise<void> {
    const logger = createLogger(config, `IM${process.env.IMAGE_ID ?? ''}(${process.pid})`);
    logger.setGlobal();

    await new ImageWorker(config, logger)
        .start();
}

if (require.main === module)
    void start();

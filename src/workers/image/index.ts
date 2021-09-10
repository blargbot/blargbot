import 'module-alias/register';

import { createLogger } from '@core/Logger';
import { ImageWorker } from '@image/ImageWorker';

export * from './ImageConnection';
export * from './ImagePool';

export default async function start(): Promise<void> {
    const config = await import('@config');
    const logger = createLogger(config, `IM${process.env.IMAGE_ID ?? ''}`);
    logger.setGlobal();

    await new ImageWorker(process, config, logger)
        .start();
}

if (require.main === module) {
    Error.stackTraceLimit = 100;
    void start();
}

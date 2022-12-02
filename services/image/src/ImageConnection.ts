import { WorkerConnection } from '@blargbot/core/worker/index.js';
import { ImageGeneratorMap, ImageIPCContract, ImageResult } from '@blargbot/image/types.js';
import { Logger } from '@blargbot/logger';

import { entrypoint } from './index.js';

export class ImageConnection extends WorkerConnection<ImageIPCContract> {
    public constructor(
        id: number,
        logger: Logger
    ) {
        super(id, '@blargbot/image', entrypoint, logger);
        this.env.IMAGE_ID = id.toString();
    }

    public async render<T extends keyof ImageGeneratorMap>(command: T, data: ImageGeneratorMap[T]): Promise<ImageResult | undefined> {
        try {
            const result = await this.request(command, data);
            if (result === null)
                return undefined;

            return {
                data: Buffer.from(result.data, 'base64'),
                fileName: result.fileName
            };
        } catch (err: unknown) {
            this.logger.error(err);
        }
        return undefined;
    }
}

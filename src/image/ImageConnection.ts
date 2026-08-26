import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { WorkerConnection } from '@blargbot/core/worker/index.js';
import type { ImageGeneratorMap, ImageIPCContract, ImageResult } from '@blargbot/image/types.js';
import type { Logger } from '@blargbot/logger';

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);

export class ImageConnection extends WorkerConnection<ImageIPCContract> {
    public constructor(
        id: number,
        logger: Logger
    ) {
        super(id, '@blargbot/image', path.join(thisDir, 'start.js'), logger);
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

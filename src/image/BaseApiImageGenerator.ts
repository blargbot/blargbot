import type { CommandMap } from 'blargbot-image-api';

import { BaseImageGenerator } from './BaseImageGenerator.js';
import type { ImageWorker } from './ImageWorker.js';
import type { ImageResult } from './types.js';

export abstract class BaseApiImageGenerator<T extends keyof CommandMap> extends BaseImageGenerator<T> {
    protected constructor(
        key: T,
        worker: ImageWorker
    ) {
        super(key, worker);
    }

    public async execute(message: CommandMap[T]): Promise<ImageResult | undefined> {
        try {
            const response = await this.fetch(this.worker.config.blargbotApi.base + this.key, {
                method: 'POST',
                headers: {
                    ['Authorization']: this.worker.config.blargbotApi.token,
                    ['Content-Type']: 'application/json'
                },
                body: JSON.stringify(message)
            });

            const contentType = response.headers.get('content-type')?.split('/');
            if (!response.ok || contentType?.[0] !== 'image' || contentType.length === 0)
                return undefined;

            const image = Buffer.from(await response.arrayBuffer());
            if (image.length > 0)
                return { data: image, fileName: `${this.key}.${contentType[1]}` };
            return undefined;

        } catch (err: unknown) {
            this.worker.logger.error(err);
            return undefined;
        }
    }
}

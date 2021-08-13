import { Logger } from '@core/Logger';
import { TypeMapping } from '@core/types';
import { CommandMap } from 'blargbot-api';
import fetch from 'node-fetch';

import { BaseImageGenerator } from './BaseImageGenerator';
import { ImageResult } from './types';

export abstract class BaseApiImageGenerator<T extends keyof CommandMap> extends BaseImageGenerator<T, CommandMap> {
    protected constructor(
        public readonly key: T,
        public readonly logger: Logger,
        private readonly apiToken: string,
        private readonly apiBase: string,
        mapping: TypeMapping<CommandMap[T]>) {
        super(key, logger, mapping);
    }

    protected async executeCore(message: CommandMap[T]): Promise<ImageResult | undefined> {
        try {
            const response = await fetch(this.apiBase + this.key, {
                method: 'POST',
                headers: {
                    ['Authorization']: this.apiToken,
                    ['Content-Type']: 'application/json'
                },
                body: JSON.stringify(message)
            });

            const contentType = response.headers.get('content-type')?.split('/');
            if (!response.ok || contentType?.[0] !== 'image' || contentType.length === 0)
                return undefined;

            const image = await response.buffer();
            if (image.length > 0)
                return { data: image, fileName: `${this.key}.${contentType[1]}` };
            return undefined;

        } catch (err: unknown) {
            this.logger.error(err);
            return undefined;
        }
    }
}

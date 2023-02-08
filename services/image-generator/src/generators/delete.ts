import path from 'node:path';

import type { DeleteOptions } from '@blargbot/image-types';

import type { ApiImageGeneratorConfig } from './base/ApiImageGenerator.js';
import ApiImageGenerator from './base/ApiImageGenerator.js';

export default class DeleteGenerator extends ApiImageGenerator<DeleteOptions> {
    public constructor(config: ApiImageGeneratorConfig) {
        super({
            ...config,
            url: path.join(config.url, 'delete')
        });
    }
}

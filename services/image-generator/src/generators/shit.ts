import path from 'node:path';

import type { ShitOptions } from '@blargbot/image-generator-client';

import type { ApiImageGeneratorConfig } from './base/ApiImageGenerator.js';
import ApiImageGenerator from './base/ApiImageGenerator.js';

export default class ShitGenerator extends ApiImageGenerator<ShitOptions> {
    public constructor(config: ApiImageGeneratorConfig) {
        super({
            ...config,
            url: path.join(config.url, 'shit')
        });
    }
}

import path from 'node:path';

import type { ColorOptions } from '@blargbot/image-generator-client';

import type { ApiImageGeneratorConfig } from './base/ApiImageGenerator.js';
import ApiImageGenerator from './base/ApiImageGenerator.js';

export default class ColorGenerator extends ApiImageGenerator<ColorOptions> {
    public constructor(config: ApiImageGeneratorConfig) {
        super({
            ...config,
            url: path.join(config.url, 'color')
        });
    }
}

import path from 'node:path';

import type { LinusOptions } from '@blargbot/image-types';

import type { ApiImageGeneratorConfig } from './base/ApiImageGenerator.js';
import ApiImageGenerator from './base/ApiImageGenerator.js';

export default class LinusGenerator extends ApiImageGenerator<LinusOptions> {
    public constructor(config: ApiImageGeneratorConfig) {
        super({
            ...config,
            url: path.join(config.url, 'linus')
        });
    }
}

import path from 'node:path';

import type { TheSearchOptions } from '@blargbot/image-types';

import type { ApiImageGeneratorConfig } from './base/ApiImageGenerator.js';
import ApiImageGenerator from './base/ApiImageGenerator.js';

export default class TheSearchGenerator extends ApiImageGenerator<TheSearchOptions> {
    public constructor(config: ApiImageGeneratorConfig) {
        super({
            ...config,
            url: path.join(config.url, 'thesearch')
        });
    }
}

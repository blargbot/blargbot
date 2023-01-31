import path from 'node:path';

import type { ClintOptions } from '@blargbot/image-types';

import type { ApiImageGeneratorConfig } from './base/ApiImageGenerator.js';
import ApiImageGenerator from './base/ApiImageGenerator.js';

export default class ClintGenerator extends ApiImageGenerator<ClintOptions> {
    public constructor(config: ApiImageGeneratorConfig) {
        super({
            ...config,
            url: path.join(config.url, 'clint')
        });
    }
}
import path from 'node:path';

import type { PCCheckOptions } from '@blargbot/image-types';

import type { ApiImageGeneratorConfig } from './base/ApiImageGenerator.js';
import ApiImageGenerator from './base/ApiImageGenerator.js';

export default class PCCheckGenerator extends ApiImageGenerator<PCCheckOptions> {
    public constructor(config: ApiImageGeneratorConfig) {
        super({
            ...config,
            url: path.join(config.url, 'pccheck')
        });
    }
}

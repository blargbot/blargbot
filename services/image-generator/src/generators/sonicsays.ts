import path from 'node:path';

import type { SonicSaysOptions } from '@blargbot/image-types';

import type { ApiImageGeneratorConfig } from './base/ApiImageGenerator.js';
import ApiImageGenerator from './base/ApiImageGenerator.js';

export default class SonicSaysGenerator extends ApiImageGenerator<SonicSaysOptions> {
    public constructor(config: ApiImageGeneratorConfig) {
        super({
            ...config,
            url: path.join(config.url, 'sonicsays')
        });
    }
}
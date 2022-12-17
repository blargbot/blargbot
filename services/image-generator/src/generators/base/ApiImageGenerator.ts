import fetch from 'node-fetch';

import ImageGenerator from './ImageGenerator.js';

export default class ApiImageGenerator<Options> extends ImageGenerator<Options> {
    readonly #config: ApiImageGeneratorConfig;

    public constructor(config: ApiImageGeneratorConfig) {
        super();
        this.#config = config;
    }

    public override async generate(options: Options): Promise<Blob> {
        const response = await fetch(this.#config.url, {
            method: 'POST',
            headers: {
                ['Authorization']: this.#config.token,
                ['Content-Type']: 'application/json'
            },
            body: JSON.stringify(options)
        });
        if (!response.ok)
            throw new Error(`Failed to generate the requested image. Status ${response.status}`);

        const result = await response.blob();
        if (result.size === 0)
            throw new Error('No data received');
        if (/^image\/?/.test(result.type))
            throw new Error(`Expected an image type response but got ${result.type}`);
        return result;
    }
}

export interface ApiImageGeneratorConfig {
    readonly url: string;
    readonly token: string;
}

import { randomUUID } from 'node:crypto';

import type { ImageOptionsMap } from '@blargbot/image-generator-client';

import type ImageGenerator from './generators/base/ImageGenerator.js';

export default class ImageGeneratorService {
    readonly #generators: Map<string, ImageGenerator<unknown>>;

    public constructor(handlers: { [P in keyof ImageOptionsMap]: ImageGenerator<ImageOptionsMap[P]> }) {
        this.#generators = new Map(Object.entries(handlers));
    }

    public async generate<P extends keyof ImageOptionsMap>(type: P, options: ImageOptionsMap[P]): Promise<Blob> {
        const generator = this.#generators.get(type);
        if (generator === undefined)
            throw new Error(`No generator found for images of type ${type}`);

        const id = randomUUID();
        console.log(`Generating ${type}`, { id, options });
        const result = await generator.generate(options);
        console.log(`Generated ${type}`, { id, size: result.size, type: result.type });
        return result;
    }
}

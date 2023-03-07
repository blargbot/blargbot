import { randomUUID } from 'node:crypto';

import type { ImageOptionsMap } from '@blargbot/image-types';
import type { MessageHandle } from '@blargbot/message-hub';

import type ImageGenerator from './generators/base/ImageGenerator.js';
import type { ImageMessageBroker } from './ImageMessageBroker.js';

export default class ImageGeneratorManager {
    readonly #messages: ImageMessageBroker;
    readonly #generators: Map<string, ImageGenerator<unknown>>;
    #handle?: Promise<MessageHandle>;

    public constructor(messages: ImageMessageBroker, handlers: { [P in keyof ImageOptionsMap]: ImageGenerator<ImageOptionsMap[P]> }) {
        this.#messages = messages;
        this.#generators = new Map(Object.entries(handlers));
    }

    public async start(): Promise<void> {
        await (this.#handle ??= this.#messages.handleImageRequest(this.generate.bind(this)));
    }

    public async stop(): Promise<void> {
        try {
            await (await this.#handle)?.disconnect();
        } catch { /* NO-OP */ }
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

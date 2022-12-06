import { fileURLToPath } from 'node:url';

import Application from '@blargbot/application';
import type { Configuration } from '@blargbot/config';
import { config } from '@blargbot/config';
import { ImageWorker } from '@blargbot/image/ImageWorker.js';
import { createLogger } from '@blargbot/logger';

export * from './ImageConnection.js';
export * from './ImagePool.js';
export const entrypoint = fileURLToPath(import.meta.url);

@Application.hostIfEntrypoint(config)
export class ImageGeneratorApp extends Application {
    readonly #worker: ImageWorker;

    public constructor(config: Configuration) {
        super();
        this.#worker = new ImageWorker(config, createLogger(config, `IM${process.env.IMAGE_ID ?? ''}`));
    }

    protected override async start(): Promise<void> {
        await this.#worker.start();
    }

    protected override async stop(): Promise<void> {
        await this.#worker.stop();
    }
}

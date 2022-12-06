import { fileURLToPath } from 'node:url';

import Application from '@blargbot/application';
import type { Configuration } from '@blargbot/config';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';
import { MasterWorker } from '@blargbot/master';

export * from './Master.js';
export * from './MasterWorker.js';
export const entrypoint = fileURLToPath(import.meta.url);

@Application.hostIfEntrypoint(config)
export class MasterApp extends Application {
    public readonly worker: MasterWorker;

    public constructor(config: Configuration) {
        super();
        this.worker = new MasterWorker(
            createLogger(config, 'MS'),
            config,
            {
                avatars: []
            }
        );
    }

    protected override async start(): Promise<void> {
        await this.worker.start();
    }

    protected override async stop(): Promise<void> {
        await this.worker.stop();
    }
}

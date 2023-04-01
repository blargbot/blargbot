import { fileURLToPath } from 'node:url';

import { host, isEntrypoint, ServiceHost } from '@blargbot/application';
import type { Configuration } from '@blargbot/config';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';
import { MasterWorker } from '@blargbot/master';

export * from './Master.js';
export * from './MasterWorker.js';
export const entrypoint = fileURLToPath(import.meta.url);

export class MasterApp extends ServiceHost {
    public constructor(config: Configuration) {
        super([
            new MasterWorker(
                createLogger(config, 'MS'),
                config,
                {
                    avatars: []
                }
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new MasterApp(config));
}

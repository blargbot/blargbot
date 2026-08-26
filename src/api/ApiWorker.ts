import type { Configuration } from '@blargbot/config';
import { BaseWorker } from '@blargbot/core/worker/index.js';
import type { Logger } from '@blargbot/logger';
import type $fetch from 'node-fetch';

import { Api } from './Api.js';
import type { ApiIPCContracts } from './types.js';

export class ApiWorker extends BaseWorker<ApiIPCContracts> {
    public readonly webServer: Api;

    public constructor(
        logger: Logger,
        public readonly config: Configuration,
        fetch: typeof $fetch
    ) {
        super(logger);
        this.logger.init(`API (pid ${this.id}) PROCESS INITIALIZED`);

        this.webServer = new Api(logger, config, fetch, { worker: this });
    }

    public async start(): Promise<void> {
        await this.webServer.start();
        await super.start();
    }

    public async stop(): Promise<void> {
        await this.webServer.stop();
        await super.stop();
    }
}

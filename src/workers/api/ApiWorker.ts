import { Configuration } from '@core/Configuration';
import { Logger } from '@core/Logger';
import { BaseWorker } from '@core/worker';

import { Api } from './Api';
import { ApiIPCContracts } from './types';

export class ApiWorker extends BaseWorker<ApiIPCContracts> {
    public readonly webServer: Api;

    public constructor(
        process: NodeJS.Process,
        public readonly config: Configuration,
        logger: Logger
    ) {
        super(process, logger);
        this.logger.init(`API (pid ${this.id}) PROCESS INITIALIZED`);

        this.webServer = new Api(logger, config, { worker: this });
    }

    public async start(): Promise<void> {
        await this.webServer.start();
        super.start();
    }

    public async stop(): Promise<void> {
        await this.webServer.stop();
        await super.stop();
    }
}

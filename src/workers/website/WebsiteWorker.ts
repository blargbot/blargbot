import { Logger } from '@core/Logger';
import { BaseWorker } from '@core/worker';

import { Website } from './Website';

export class WebsiteWorker extends BaseWorker {
    public readonly webServer: Website;

    public constructor(
        public readonly config: Configuration,
        logger: Logger
    ) {
        super(logger);
        this.logger.init(`WEBSITE (pid ${this.id}) PROCESS INITIALIZED`);

        this.webServer = new Website(logger, config, { worker: this });
    }

    public async start(): Promise<void> {
        await this.webServer.start();
        super.start();
    }
}

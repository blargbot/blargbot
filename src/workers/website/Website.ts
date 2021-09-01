import { BaseClient } from '@core/BaseClient';
import { Logger } from '@core/Logger';

import { WebsiteOptions } from './types';
import { WebsiteWorker } from './WebsiteWorker';

export class Website extends BaseClient {
    public readonly worker: WebsiteWorker;

    public constructor(
        logger: Logger,
        config: Configuration,
        options: WebsiteOptions
    ) {
        super(logger, config, {
            intents: []
        });

        this.worker = options.worker;
    }
}

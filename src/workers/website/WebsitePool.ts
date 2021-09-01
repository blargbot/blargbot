import { Logger } from '@core/Logger';
import { WorkerPool } from '@core/worker';

import { WebsiteConnection } from './WebsiteConnection';

export class WebsitePool extends WorkerPool<WebsiteConnection> {
    public constructor(logger: Logger) {
        super('Image', 1, 60000, logger);
    }

    protected createWorker(id: number): WebsiteConnection {
        return new WebsiteConnection(id, this.logger);
    }
}

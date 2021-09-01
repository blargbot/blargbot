import { Logger } from '@core/Logger';
import { WorkerConnection } from '@core/worker';

export class WebsiteConnection extends WorkerConnection {
    public constructor(id: number, logger: Logger) {
        super(id, 'website', logger);
    }
}

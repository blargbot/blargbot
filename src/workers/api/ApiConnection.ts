import { Logger } from '@core/Logger';
import { WorkerConnection } from '@core/worker';

export class ApiConnection extends WorkerConnection<'api'> {
    public constructor(id: number, logger: Logger) {
        super(id, 'api', logger);
    }
}

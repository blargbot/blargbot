import { Logger } from '@blargbot/core/Logger';
import { WorkerPool } from '@blargbot/core/worker';

import { ApiConnection } from './ApiConnection';

export class ApiPool extends WorkerPool<ApiConnection> {
    public constructor(logger: Logger) {
        super('Api', 1, 60000, logger);
    }

    protected createWorker(id: number): ApiConnection {
        return new ApiConnection(id, this.logger);
    }
}

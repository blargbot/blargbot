import { WorkerPool } from '@blargbot/core/worker';
import { Logger } from '@blargbot/logger';

import { ApiConnection } from './ApiConnection';

export class ApiPool extends WorkerPool<ApiConnection> {
    public constructor(logger: Logger) {
        super('Api', 1, 60000, logger);
    }

    protected createWorker(id: number): ApiConnection {
        return new ApiConnection(id, this.logger);
    }
}

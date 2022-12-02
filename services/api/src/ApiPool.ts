import { RespawnStrategy, WorkerPool } from '@blargbot/core/worker/index.js';
import { Logger } from '@blargbot/logger';

import { ApiConnection } from './ApiConnection.js';

export class ApiPool extends WorkerPool<ApiConnection> {
    public constructor(logger: Logger) {
        super({
            type: 'Api',
            workerCount: 1,
            defaultTimeout: 60000,
            logger,
            respawnStrategy: RespawnStrategy.KILL_THEN_SPAWN
        });
    }

    protected createWorker(id: number): ApiConnection {
        return new ApiConnection(id, this.logger);
    }
}

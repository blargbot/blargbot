import type { ApiConnection } from '@blargbot/api';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes/index.js';
import { WorkerState } from '@blargbot/core/worker/index.js';
import type { Master } from '@blargbot/master';
import moment from 'moment-timezone';

export class ApiExitHandler extends WorkerPoolEventService<ApiConnection, 'exit'> {
    public constructor(
        public readonly master: Master
    ) {
        super(master.api, 'exit', ({ worker }) => this.alertExit(worker));
    }

    public async alertExit(worker: ApiConnection): Promise<void> {
        if (worker.state !== WorkerState.EXITED)
            return;

        const diedAt = moment();
        this.master.logger.cluster(`Api ${worker.id} has died, respawning...`);
        await this.master.api.spawn(worker.id);
        this.master.logger.cluster(`Api ${worker.id} is back after ${moment.duration(moment().diff(diedAt)).asSeconds()} seconds`);
    }
}
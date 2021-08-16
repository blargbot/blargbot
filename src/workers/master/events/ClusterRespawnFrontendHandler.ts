import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class RespawnFrontendHandler extends WorkerPoolEventService<ClusterConnection> {
    public constructor(private readonly master: Master) {
        super(master.clusters, 'respawnFrontend');
    }

    protected execute(): void {
        // TODO once the frontend is added back
        this.master.logger.fatal('Frontend isnt supported yet ya dummy!');
    }
}

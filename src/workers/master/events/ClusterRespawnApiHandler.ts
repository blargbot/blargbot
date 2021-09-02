import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { WorkerPoolEventHandler } from '@core/types';
import { Master } from '@master';

export class RespawnApiHandler extends WorkerPoolEventService<ClusterConnection> {
    public constructor(private readonly master: Master) {
        super(master.clusters, 'respawnApi');
    }

    protected async execute(...[, , , reply]: Parameters<WorkerPoolEventHandler<ClusterConnection>>): Promise<void> {
        await this.master.api.killAll();
        await this.master.api.spawnAll();
        reply(true);
    }
}

import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class KillAllHandler extends WorkerPoolEventService<ClusterConnection> {
    public constructor(private readonly master: Master) {
        super(master.clusters, 'killAll');
    }

    protected execute(): never {
        this.master.logger.fatal('We all deserve to die. Even you, mister cat. Even I.');
        this.master.clusters.killAll();
        process.exit(0);
    }
}

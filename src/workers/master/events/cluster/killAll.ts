import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ClusterKillAllHandler extends WorkerPoolEventService<ClusterConnection, 'killAll'> {
    public constructor(private readonly master: Master) {
        super(master.clusters, 'killAll', () => this.killAll());
    }

    protected async killAll(): Promise<never> {
        this.master.logger.fatal('We all deserve to die. Even you, mister cat. Even I.');
        await Promise.all([
            this.master.clusters.killAll(),
            this.master.api.killAll()
        ]);
        process.exit(0);
    }
}

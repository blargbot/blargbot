import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ClusterKillAllHandler extends WorkerPoolEventService<ClusterConnection> {
    public constructor(private readonly master: Master) {
        super(master.clusters, 'killAll');
    }

    protected async execute(): Promise<never> {
        this.master.logger.fatal('We all deserve to die. Even you, mister cat. Even I.');
        await this.master.clusters.killAll();
        process.exit(0);
    }
}

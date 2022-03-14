import { Cluster } from '@cluster';
import { discord } from '@cluster/utils';
import { IntervalService } from '@core/serviceTypes';

export class ClusterStatsInterval extends IntervalService {
    public readonly type = 'cluster';
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(10000, cluster.logger);
    }

    public execute(): void | Promise<void> {
        this.cluster.worker.send('clusterStats', discord.cluster.getStats(this.cluster));
    }
}

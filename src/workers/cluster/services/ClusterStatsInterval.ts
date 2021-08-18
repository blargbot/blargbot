import { Cluster } from '@cluster';
import { discordUtil } from '@cluster/utils';
import { IntervalService } from '@core/serviceTypes';

export class ClusterStatsInterval extends IntervalService {
    public readonly type = 'cluster';
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(10000, cluster.logger);
    }

    protected execute(): void | Promise<void> {
        this.cluster.worker.send('clusterStats', discordUtil.cluster.getStats(this.cluster));
    }
}

import { Cluster } from '@blargbot/cluster';
import { discord } from '@blargbot/cluster/utils/index.js';
import { IntervalService } from '@blargbot/core/serviceTypes/index.js';

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

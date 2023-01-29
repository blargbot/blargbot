import type { Cluster } from '@blargbot/cluster';
import { IntervalService } from '@blargbot/core/serviceTypes/index.js';

import { getStats } from '../utils/index.js';

export class ClusterStatsInterval extends IntervalService {
    public readonly type = 'cluster';
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(10000, cluster.logger);
    }

    public execute(): void | Promise<void> {
        this.cluster.worker.send('clusterStats', getStats(this.cluster));
    }
}

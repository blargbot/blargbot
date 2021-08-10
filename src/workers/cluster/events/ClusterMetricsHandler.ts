import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { metrics } from '@core/Metrics';
import { ProcessMessageHandler } from '@core/types';

export class ClusterMetricsHandler extends ClusterEventService {
    public constructor(cluster: Cluster) {
        super(cluster, 'metrics');
    }

    protected execute([, , reply]: Parameters<ProcessMessageHandler>): void {
        metrics.userGauge.set(this.cluster.discord.users.cache.size);
        reply(metrics.aggregated.getMetricsAsJSON());
    }
}

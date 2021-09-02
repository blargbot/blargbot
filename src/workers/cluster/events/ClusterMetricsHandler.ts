import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { metrics } from '@core/Metrics';
import { mapping } from '@core/utils';
import { metric } from 'prom-client';

export class ClusterMetricsHandler extends ClusterEventService<unknown, metric[]> {
    public constructor(cluster: Cluster) {
        super(
            cluster,
            'metrics',
            mapping.mapUnknown,
            ({ reply }) => reply(this.getMetrics())
        );
    }

    public getMetrics(): metric[] {
        metrics.userGauge.set(this.cluster.discord.users.cache.size);
        return metrics.aggregated.getMetricsAsJSON();
    }
}

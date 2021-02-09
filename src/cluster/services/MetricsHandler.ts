import { metric } from 'prom-client';
import { ClusterEventService } from '../../structures/ClusterEventService';
import { Cluster } from '../Cluster';


export class MetricsHandler extends ClusterEventService<'metrics'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'metrics');
    }

    protected execute(_: unknown, reply: (data: metric[]) => void): void {
        this.cluster.metrics.userGauge.set(this.cluster.discord.users.size);
        reply(this.cluster.metrics.aggregated.getMetricsAsJSON());
    }
}

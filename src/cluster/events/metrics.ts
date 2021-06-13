import { ClusterEventService } from '../../structures/ClusterEventService';
import { ProcessMessageHandler } from '../../workers/core/IPCEvents';
import { Cluster } from '../Cluster';
import { metrics } from '../../core/Metrics';


export class MetricsHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'metrics');
    }

    protected execute([, , reply]: Parameters<ProcessMessageHandler>): void {
        metrics.userGauge.set(this.cluster.discord.users.size);
        reply(metrics.aggregated.getMetricsAsJSON());
    }
}

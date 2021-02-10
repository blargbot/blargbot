import { ClusterEventService } from '../../structures/ClusterEventService';
import { ProcessMessageHandler } from '../../workers/core/IPCEvents';
import { Cluster } from '../Cluster';


export class MetricsHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'metrics');
    }

    protected execute([, , reply]: Parameters<ProcessMessageHandler>): void {
        this.cluster.metrics.userGauge.set(this.cluster.discord.users.size);
        reply(this.cluster.metrics.aggregated.getMetricsAsJSON());
    }
}

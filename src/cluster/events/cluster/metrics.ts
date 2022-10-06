import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes';
import { metrics } from '@blargbot/core/Metrics';
import { metric } from 'prom-client';

export class ClusterMetricsHandler extends ClusterEventService<`metrics`> {
    public constructor(cluster: Cluster) {
        super(
            cluster,
            `metrics`,
            async ({ reply }) => reply(await this.getMetrics())
        );
    }

    public async getMetrics(): Promise<metric[]> {
        metrics.userGauge.set(this.cluster.discord.users.size);
        return await (await metrics.getAggregated()).getMetricsAsJSON();
    }
}

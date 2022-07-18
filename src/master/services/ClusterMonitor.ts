import { ClusterConnection } from '@blargbot/cluster';
import { IntervalService } from '@blargbot/core/serviceTypes';
import { WorkerState } from '@blargbot/core/worker';
import { Master } from '@blargbot/master';
import moment from 'moment-timezone';

export class ClusterMonitor extends IntervalService {
    public readonly type = 'cluster';

    public constructor(
        public readonly master: Master
    ) {
        super(10000, master.logger);
    }

    public async execute(): Promise<void> {
        await this.master.clusters.forEach((_, cluster) => this.#checkCluster(cluster));
    }

    #getClusterIssues(cluster: ClusterConnection): string[] {
        const stats = this.master.clusterStats.get(cluster);
        const now = moment();
        const cutoff = moment().add(-1, 'minute');

        function secondsSince(time: number | moment.Moment): number {
            return moment.duration(now.diff(time)).asSeconds();
        }

        if (stats === undefined) {
            if (cluster.created.isBefore(cutoff))
                return [`⏰ Cluster ${cluster.id} was created ${secondsSince(cluster.created)} seconds ago but hasn't posted stats yet`];
            return [];
        }

        if (cutoff.isAfter(stats.time))
            return [`⏰ Cluster ${cluster.id} hasn't posted stats for ${secondsSince(stats.time)} seconds`];

        return stats.shards.filter(s => cutoff.isAfter(s.time)).map(s => `⏰ shard ${s.id} unresponsive for ${secondsSince(s.time)} seconds`);
    }

    async #checkCluster(cluster?: ClusterConnection): Promise<void> {
        if (cluster?.state !== WorkerState.RUNNING)
            return;

        const issues = this.#getClusterIssues(cluster);
        if (issues.length === 0)
            return;

        await Promise.all([
            this.master.util.send(
                this.master.config.discord.channels.shardlog,
                `Respawning unresponsive cluster ${cluster.id}...\n${issues.join('\n')}`),
            this.master.clusters.spawn(cluster.id)
        ]);
    }
}

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

    public execute(cluster?: ClusterConnection): void {
        if (cluster === undefined) {
            return this.master.clusters.forEach((_, cluster) =>
                cluster !== undefined ? this.execute(cluster) : undefined);
        }

        if (cluster.state !== WorkerState.RUNNING)
            return;

        const stats = this.master.clusterStats.get(cluster.id);
        const now = moment();
        const cutoff = moment().add(-1, 'minute');
        const alerts = [];

        if (stats !== undefined) {
            for (const shard of stats.shards) {
                if (cutoff.isAfter(shard.time)) {
                    const diff = moment.duration(now.diff(shard.time));
                    const msg = `⏰ shard ${shard.id} unresponsive for ${diff.asSeconds()} seconds`;
                    this.logger.cluster(msg);
                    alerts.push(msg);
                }
            }
        } else if (cluster.created.isBefore(cutoff)) {
            const diff = moment.duration(now.diff(cluster.created));
            const msg = `⏰ Cluster ${cluster.id} was created ${diff.asSeconds()} seconds ago but hasnt posted stats yet`;
            this.logger.cluster(msg);
            alerts.push(msg);
        }

        if (alerts.length === 0)
            return;

        this.master.clusterStats.set(cluster.id, undefined);
        void this.master.util.send(
            this.master.config.discord.channels.shardlog,
            `Respawning unresponsive cluster ${cluster.id}...\n${alerts.join('\n')}`);
        void this.master.clusters.spawn(cluster.id);
    }
}

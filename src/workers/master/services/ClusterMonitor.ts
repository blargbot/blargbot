import { ClusterConnection } from '@cluster';
import { IntervalService } from '@core/serviceTypes';
import { WorkerState } from '@core/worker';
import { Master } from '@master';
import moment from 'moment';

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
                    alerts.push(`⏰ shard ${shard.id} unresponsive for ${diff.asSeconds()} seconds`);
                }
            }
        } else if (cluster.created.isBefore(cutoff)) {
            const diff = moment.duration(now.diff(cluster.created));
            alerts.push(`⏰ Cluster ${cluster.id} was created ${diff.asSeconds()} seconds ago but hasnt posted stats yet`);
        }

        if (alerts.length === 0)
            return;

        this.master.clusterStats.set(cluster.id, undefined);
        void this.master.discord.createMessage(this.master.config.discord.channels.shardlog, `Respawning unresponsive cluster ${cluster.id}...\n${alerts.join('\n')}`);
        void this.master.clusters.spawn(cluster.id);
    }
}

import moment from 'moment';
import { ClusterConnection } from '../../cluster';
import { IntervalService, WorkerState } from '../core';
import { ClusterStatsHandler } from '../events/clusterStats';
import { Master } from '../Master';

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
                cluster ? this.execute(cluster) : undefined);
        }

        if (cluster.state !== WorkerState.RUNNING)
            return;

        const statsTracker = this.master.eventHandlers.get(ClusterStatsHandler.name, ClusterStatsHandler);
        const stats = statsTracker?.get(cluster.id);
        const now = moment();
        const cutoff = moment().add(-1, 'minute');
        const alerts = [];

        if (stats) {
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

        statsTracker?.clear(cluster.id);
        void this.master.discord.createMessage(this.master.config.discord.channels.shardlog, `Respawning unresponsive cluster ${cluster.id}...\n${alerts.join('\n')}`);
        void this.master.clusters.spawn(cluster.id);
    }
}
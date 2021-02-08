import moment from 'moment';
import { Master } from '../master/Master';
import { ClusterConnection } from './ClusterConnection';
import { WorkerPool } from './core/WorkerPool';

export interface ClusterPoolOptions {
    worker?: string;
}

export class ClusterPool extends WorkerPool<ClusterConnection> {
    public constructor(
        public readonly client: Master,
        logger: CatLogger
    ) {
        super('Cluster', Math.ceil(client.config.shards.max / client.config.shards.perCluster), logger);

        setInterval(() => this.keepAlive(), 10000);
    }

    protected createWorker(id: number): ClusterConnection {
        const cluster = new ClusterConnection(
            id,
            this.shardRange(id),
            this.client.config.shards.max,
            this.logger
        );

        return cluster;
    }

    public shardRange(clusterId: number): [firstShard: number, lastShard: number] {
        if (clusterId >= this.workerCount)
            throw new Error(`Cluster ${clusterId} doesnt exist`);

        const perCluster = this.client.config.shards.perCluster;
        const firstShard = clusterId * perCluster;
        const lastShard = Math.min(firstShard + perCluster, this.client.config.shards.max) - 1;
        return [firstShard, lastShard];
    }

    // TODO maybe this logic should be higher up, does the cluster pool need to do this?
    private keepAlive(): void {
        for (const cluster of this) {
            if (cluster === undefined) // cluster is not spawned
                continue;

            const now = moment();
            const cutoff = moment().add(-1, 'minute');
            const alerts = [];

            if (cluster.stats) {
                for (const shard of cluster.stats?.shards) {
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
                continue;

            void this.client.discord.createMessage(this.client.config.discord.channels.shardlog,
                `Respawning unresponsive cluster ${cluster.id}...\n${alerts.join('\n')}`);
            void this.spawn(cluster.id);
        }
    }
}
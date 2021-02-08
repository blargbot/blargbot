import { Client as ErisClient } from 'eris';
import moment from 'moment';
import { ClusterConnection } from '../workers/ClusterConnection';
import { ClusterPool } from '../workers/ClusterPool';

export class ClusterMonitor {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #monitor?: NodeJS.Timeout;

    public constructor(
        public readonly clusters: ClusterPool,
        public readonly discord: ErisClient,
        public readonly logChannel: string,
        public readonly logger: CatLogger
    ) {
        this.clusters.on('spawnedworker', (id: number, cluster: ClusterConnection) => {
            const detach: () => void = () => {
                cluster.off('disconnect', respawn);
                cluster.off('exit', respawn);
                cluster.off('close', respawn);
                cluster.off('kill', detach);
            };
            const respawn: () => void = async () => {
                detach();
                const diedAt = moment();
                this.logger.worker(`Cluster ${id} has died, respawning...`);
                await this.clusters.spawn(id);
                this.logger.worker(`Cluster ${id} is back after ${moment.duration(moment().diff(diedAt)).asSeconds()} seconds`);
            };
            cluster.on('disconnect', respawn);
            cluster.on('exit', respawn);
            cluster.on('close', respawn);
            cluster.on('kill', detach);
        });
    }

    public start(): void {
        this.#monitor ??= setInterval(() => void this.keepAlive(), 10000);
    }

    public stop(): void {
        if (this.#monitor)
            clearInterval(this.#monitor);
        this.#monitor = undefined;
    }

    public async keepAlive(cluster?: ClusterConnection): Promise<void> {
        if (cluster === undefined) {
            return this.clusters.forEach((_, cluster) =>
                cluster ? this.keepAlive(cluster) : undefined);
        }

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
            return;

        await this.discord.createMessage(this.logChannel, `Respawning unresponsive cluster ${cluster.id}...\n${alerts.join('\n')}`);
        await this.clusters.spawn(cluster.id);
    }
}
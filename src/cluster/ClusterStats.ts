import { Cluster } from "./Cluster";
import moment, { Moment } from 'moment-timezone';

export class ClusterStats {
    #lastReady: Map<number, Moment>;

    constructor(
        public readonly cluster: Cluster
    ) {
        this.#lastReady = new Map();
    }

    public getLastReady(shardId: number): Moment {
        if (this.cluster.discord.shards.get(shardId)?.status === 'ready')
            this.#lastReady.set(shardId, moment());

        return this.#lastReady.get(shardId)
            ?? this.cluster.createdAt;
    }

    public getCurrent() {
        return {
            id: this.cluster.id,
            time: Date.now(),
            readyTime: this.cluster.createdAt.valueOf(),
            guilds: this.cluster.discord.guilds.size,
            shardCount: this.cluster.discord.shards.size,
            shards: this.cluster.discord.shards.map(s => ({
                id: s.id,
                status: s.status,
                latency: s.latency,
                guilds: this.cluster.discord.guilds.filter(g => g.shard.id === s.id).length,
                cluster: this.cluster.id,
                time: this.getLastReady(s.id).valueOf()
            }))
        }
    }
}
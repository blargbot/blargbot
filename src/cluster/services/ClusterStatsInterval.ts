import moment from 'moment';
import { Moment } from 'moment-timezone';
import { Cluster } from '../Cluster';
import { cpuLoad } from '../../utils';
import { IntervalService } from '../../structures/IntervalService';
import { ClusterStats } from '../../workers/ClusterTypes';

export class ClusterStatsInterval extends IntervalService {
    public readonly type = 'cluster';
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #lastReady: Map<number, Moment>;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(10000, cluster.logger);
        this.#lastReady = new Map();
    }

    protected execute(): void | Promise<void> {
        this.cluster.worker.send('clusterStats', <ClusterStats>{
            id: this.cluster.id,
            time: Date.now().valueOf(),
            readyTime: this.cluster.createdAt.valueOf(),
            guilds: this.cluster.discord.guilds.size,
            rss: this.cluster.worker.memoryUsage.rss,
            ...cpuLoad(),
            shardCount: this.cluster.discord.shards.size,
            shards: this.cluster.discord.shards.map(s => ({
                id: s.id,
                status: s.status,
                latency: s.latency,
                guilds: this.cluster.discord.guilds.filter(g => g.shard.id === s.id).length,
                cluster: this.cluster.id,
                time: this.getLastReady(s.id).valueOf()
            }))
        });
    }

    private getLastReady(shardId: number): Moment {
        if (this.cluster.discord.shards.get(shardId)?.status === 'ready')
            this.#lastReady.set(shardId, moment());

        return this.#lastReady.get(shardId)
            ?? this.cluster.createdAt;
    }
}
import { Cluster } from '@cluster';
import { ClusterStats } from '@cluster/types';
import { cpuLoad } from '@cluster/utils';
import { IntervalService } from '@core/serviceTypes';
import { ConstantsStatus, WebSocketShard } from 'discord.js';
import moment from 'moment';
import { Moment } from 'moment-timezone';

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
            guilds: this.cluster.discord.guilds.cache.size,
            rss: this.cluster.worker.memoryUsage.rss,
            ...cpuLoad(),
            shardCount: this.cluster.discord.ws.shards.size,
            shards: this.cluster.discord.ws.shards.map(s => ({
                id: s.id,
                status: statusMap[s.status as keyof typeof statusMap],
                latency: s.ping,
                guilds: this.cluster.discord.guilds.cache.filter(g => g.shard.id === s.id).size,
                cluster: this.cluster.id,
                time: this.getLastReady(s).valueOf()
            }))
        });
    }

    private getLastReady(shard: WebSocketShard): Moment {
        if (shard.status === statuses.CONNECTING)
            this.#lastReady.set(shard.id, moment());

        return this.#lastReady.get(shard.id)
            ?? this.cluster.createdAt;
    }
}

/* eslint-disable @typescript-eslint/naming-convention */
const statuses: ConstantsStatus = {
    READY: 0,
    CONNECTING: 1,
    RECONNECTING: 2,
    IDLE: 3,
    NEARLY: 4,
    DISCONNECTED: 5
};
/* eslint-enable @typescript-eslint/naming-convention */

const statusMap: { [P in keyof ConstantsStatus as ConstantsStatus[P]]: P } = {
    0: 'READY',
    1: 'CONNECTING',
    2: 'RECONNECTING',
    3: 'IDLE',
    4: 'NEARLY',
    5: 'DISCONNECTED'
};

import { Cluster } from '@cluster';
import { ClusterStats, ShardStats } from '@cluster/types';
import { cpuLoad } from '@cluster/utils';
import { mapping } from '@core/utils';
import { ConstantsStatus, WebSocketShard } from 'discord.js';
import moment, { Moment } from 'moment';

const lastReady: Map<number, Moment> = new Map();

/* eslint-disable @typescript-eslint/naming-convention */
const statuses: ConstantsStatus = {
    READY: 0,
    CONNECTING: 1,
    RECONNECTING: 2,
    IDLE: 3,
    NEARLY: 4,
    DISCONNECTED: 5
};

function getLastReady(cluster: Cluster, shard: WebSocketShard): Moment {
    if (shard.status === statuses.READY)
        lastReady.set(shard.id, moment());

    return lastReady.get(shard.id)
        ?? cluster.createdAt;
}

const statusMap: { [P in keyof ConstantsStatus as ConstantsStatus[P]]: P } = {
    0: 'READY',
    1: 'CONNECTING',
    2: 'RECONNECTING',
    3: 'IDLE',
    4: 'NEARLY',
    5: 'DISCONNECTED'
};

export const statusEmojiMap = {
    'READY': '✅',
    'CONNECTING': '♻️',
    'RECONNECTING': '♻️',
    'IDLE': '💤',
    'NEARLY': '📡',
    'DISCONNECTED': '❌'
};

export function getStats(cluster: Cluster): ClusterStats {
    return {
        id: cluster.id,
        time: Date.now().valueOf(),
        readyTime: cluster.createdAt.valueOf(),
        guilds: cluster.discord.guilds.cache.size,
        users: cluster.discord.guilds.cache.reduce((a, c) => c.memberCount + a, 0),
        channels: cluster.discord.guilds.cache.reduce((a, c) => c.channels.cache.size + a, 0),
        rss: cluster.worker.memoryUsage.rss,
        ...cpuLoad(),
        shardCount: cluster.discord.ws.shards.size,
        shards: cluster.discord.ws.shards.map(s => ({
            id: s.id,
            status: statusMap[s.status as keyof typeof statusMap],
            latency: s.ping, //! For some reason g.shard can be undefined
            guilds: cluster.discord.guilds.cache.filter(g => <WebSocketShard | undefined>g.shard !== undefined ? g.shard.id === s.id : false).size,
            cluster: cluster.id,
            time: getLastReady(cluster, s).valueOf()
        }))
    };
}
export async function getAllStats(cluster: Cluster): Promise<Record<number, ClusterStats>> {
    const result = clusterStatsMapping(await cluster.worker.request('getClusterStats', undefined));
    return result.valid ? result.value : {};
}

export async function getGuildClusterStats(cluster: Cluster, guildID: string): Promise<{ cluster: ClusterStats; shard: ShardStats; }> {
    const id = BigInt(guildID);
    const shardID = Number((id >> BigInt(22)) % BigInt(cluster.config.discord.shards.max));
    let clusterData: ClusterStats;

    if (Math.floor(shardID / cluster.config.discord.shards.perCluster) === cluster.id) {
        clusterData = getStats(cluster);
    } else {
        const allClusterData = await getAllStats(cluster);
        const clusterID = Math.floor(shardID / cluster.config.discord.shards.perCluster);
        clusterData = allClusterData[clusterID];
    }

    const shard = clusterData.shards.find(s => s.id === shardID) as ShardStats;
    return {
        cluster: clusterData,
        shard
    };
}

export async function getClusterStats(cluster: Cluster, clusterID: number): Promise<ClusterStats | undefined> {
    const allClusterData = await getAllStats(cluster);
    return allClusterData[clusterID];
}

const clusterStatsMapping = mapping.mapObject({
    channels: mapping.mapNumber,
    guilds: mapping.mapNumber,
    id: mapping.mapNumber,
    readyTime: mapping.mapNumber,
    rss: mapping.mapNumber,
    shardCount: mapping.mapNumber,
    shards: mapping.mapArray(mapping.mapObject({
        id: mapping.mapNumber,
        status: mapping.mapIn('READY', 'CONNECTING', 'RECONNECTING', 'IDLE', 'NEARLY', 'DISCONNECTED'),
        latency: mapping.mapNumber,
        guilds: mapping.mapNumber,
        cluster: mapping.mapNumber,
        time: mapping.mapNumber
    })),
    systemCpu: mapping.mapNumber,
    time: mapping.mapNumber,
    userCpu: mapping.mapNumber,
    users: mapping.mapNumber
});

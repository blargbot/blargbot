import type { Cluster } from '@blargbot/cluster';
import type { ClusterStats, ShardStats } from '@blargbot/cluster/types.js';
import { cpuLoad } from '@blargbot/cluster/utils/index.js';
import type * as Eris from 'eris';
import moment from 'moment-timezone';

const lastReady: Map<number, moment.Moment> = new Map();

function getLastReady(cluster: Cluster, shard: Eris.Shard): moment.Moment {
    if (shard.status === 'ready')
        lastReady.set(shard.id, moment());

    return lastReady.get(shard.id)
        ?? cluster.createdAt;
}

export const statusEmojiMap: { [P in Eris.Shard['status']]: string } = {
    'ready': '✅',
    'connecting': '♻️',
    'resuming': '♻️',
    'disconnected': '❌',
    'identifying': '📡',
    'handshaking': '📡'
};

export function getStats(cluster: Cluster): ClusterStats {
    return {
        id: cluster.id,
        time: Date.now().valueOf(),
        readyTime: cluster.createdAt.valueOf(),
        guilds: cluster.discord.guilds.size,
        users: cluster.discord.guilds.reduce((a, c) => c.memberCount + a, 0),
        channels: cluster.discord.guilds.reduce((a, c) => c.channels.size + a, 0),
        rss: cluster.worker.memoryUsage.rss,
        ...cpuLoad(),
        shardCount: cluster.discord.shards.size,
        shards: cluster.discord.shards.map(s => ({
            id: s.id,
            status: s.status,
            latency: s.latency, //! For some reason g.shard can be undefined
            guilds: cluster.discord.guilds.filter(g => g.shard.id === s.id).length,
            cluster: cluster.id,
            time: getLastReady(cluster, s).valueOf()
        }))
    };
}

export async function getGuildClusterStats(cluster: Cluster, guildID: string): Promise<{ cluster: ClusterStats; shard: ShardStats; }> {
    const id = BigInt(guildID);
    const shardID = Number((id >> BigInt(22)) % BigInt(cluster.config.discord.shards.max));
    let clusterData: ClusterStats | undefined;

    if (Math.floor(shardID / cluster.config.discord.shards.perCluster) === cluster.id) {
        clusterData = getStats(cluster);
    } else {
        const allClusterData = await cluster.worker.request('getClusterStats', undefined);
        const clusterID = Math.floor(shardID / cluster.config.discord.shards.perCluster);
        clusterData = allClusterData[clusterID];
        if (clusterData === undefined)
            throw new Error(`Invalid cluster ${clusterID}`);
    }

    const shard = clusterData.shards.find(s => s.id === shardID) as ShardStats;
    return {
        cluster: clusterData,
        shard
    };
}

export async function getClusterStats(cluster: Cluster, clusterID: number): Promise<ClusterStats | undefined> {
    const allClusterData = await cluster.worker.request('getClusterStats', undefined);
    return allClusterData[clusterID];
}

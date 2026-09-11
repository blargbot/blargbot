import { type DiscordClusterChannel } from '@blargbot/contracts';
import { debounce, Semaphore, usingInterval } from '@blargbot/util';
import type { GatewayManager } from '@discordeno/gateway';

export async function installDistributedSharding(
    options: {
        gateway: GatewayManager;
        channel: DiscordClusterChannel;
        clusterTimeoutMs?: number;
        topologyDebounceMs?: number;
        pruneDelayMs?: number;
    }
): Promise<AsyncDisposable> {
    const { gateway, channel, clusterTimeoutMs = 5 * 60_000, topologyDebounceMs = 2 * 60_000, pruneDelayMs = 30_000 } = options;
    assertTimeout(clusterTimeoutMs);
    assertTimeout(topologyDebounceMs);
    assertTimeout(pruneDelayMs);

    const lockSharding = new Semaphore();
    const activeClusters = new Map<string, ClusterState>();
    const unhealthyClusters = new Map<string, number>();
    let activeTopology = new ClusterTopology(gateway.totalShards, activeClusters);
    let targetTopology: ClusterTopology | undefined;

    const isReshardingInProgress = (): boolean => targetTopology !== undefined;
    const onClustersChanged = debounce(
        () => void (async () => {
            if (isReshardingInProgress())
                return;

            const sessionInfo = await (gateway.resharding.getSessionInfo?.() ?? gateway.connection);

            if (isReshardingInProgress())
                return;

            if (
                activeTopology.targetShards === sessionInfo.shards
                && gateway.totalShards === sessionInfo.shards
                && activeTopology.clusters.symmetricDifference(activeClusters).size === 0
            ) {
                gateway.logger.info('[Resharding] The topology hasnt changed, skipping reshard.');
                return;
            }

            gateway.logger.info('[Resharding] Clusters have changed, starting resharding.');
            await gateway.resharding.reshard(sessionInfo);
        })().catch(err => gateway.logger.error('[Resharding] Clusters changed but resharding failed.', err)),
        topologyDebounceMs,
        topologyDebounceMs * 5
    );

    const onReshardingComplete = debounce(
        () => void (async () => {
            using _lock = await lockSharding.enter();
            await channel.pruneShards(undefined);
        })().catch(err => gateway.logger.error('[Resharding] Failed to prune old shards.', err)),
        pruneDelayMs,
        pruneDelayMs * 5
    );

    gateway.calculateWorkerId = (shardId) => shardId;

    const reshard = gateway.resharding.reshard;
    gateway.resharding.reshard = async (info) => {
        using _lock = await lockSharding.enter();
        try {
            gateway.url = info.url;
            await reshard.call(gateway, info);
        } finally {
            targetTopology = undefined;
        }
    };

    const spawnShards = gateway.spawnShards;
    gateway.spawnShards = async () => {
        using _lock = await lockSharding.enter();
        try {
            await spawnShards.call(gateway);
            await gateway.resharding.onReshardingSwitch();
        } finally {
            targetTopology = undefined;
        }
    };

    const prepareBuckets = gateway.prepareBuckets;
    gateway.prepareBuckets = () => {
        targetTopology ??= new ClusterTopology(gateway.totalShards, activeClusters);
        gateway.logger.info(`[Resharding] Transitioning cluster shard topology:\n${ClusterTopology.diff(activeTopology, targetTopology)}`);
        prepareBuckets.call(gateway);
    };

    gateway.tellWorkerToIdentify = gateway.resharding.tellWorkerToPrepare = async (_, shardId) => {
        const topology = targetTopology ?? activeTopology;
        const clusterId = topology.getCluster(shardId);
        if (clusterId === undefined)
            return;
        const totalShards = gateway.totalShards;
        const result = await channel.identifyShard({
            shardId,
            totalShards,
            groupId: topology.id,
            intents: gateway.intents,
            token: gateway.token,
            url: gateway.url,
            version: gateway.version
        }, clusterId);
        if (result.error !== undefined) {
            throw new Error(`Failed to identify ${shardId}/${totalShards} on cluster ${clusterId}: ${result.error}`);
        }
    };

    gateway.resharding.onReshardingSwitch = async () => {
        const topology = targetTopology ?? activeTopology;
        if (topology.clusters.size === 0 && activeTopology.clusters.size === 0) {
            gateway.logger.warn('No clusters are currently known, skipping switching to a topology that may not exist.');
        } else {
            await channel.switchShards({ groupId: topology.id });
            activeTopology = topology;
            // Trigger a check for any changes to the cluster topology that happened during resharding.
            onReshardingComplete();
            onClustersChanged();
            gateway.logger.info('[Resharding] Resharding is completed, scheduling a reshard incase any changes were made during the reshard.');
        }
    };

    gateway.sendPayload = async (shardId, payload) => {
        const clusterId = activeTopology.getCluster(shardId);
        if (clusterId === undefined)
            throw new Error('That shard does not exist.');
        await channel.sendToGateway({
            ...payload,
            totalShards: gateway.totalShards,
            shardId: shardId
        }, clusterId);
    };

    gateway.editBotStatus = async (data) => await channel.setPresence(data);

    const permitIdentifyHandle = await channel.handlePermitIdentify(async message => {
        try {
            await gateway.requestIdentify(message.shardId);
            return {};
        } catch (error) {
            if (error instanceof Error)
                return { error: error.message };
            return { error: String(error) };
        }
    });

    function clusterTimedOut(clusterId: string, lastStats: number): void {
        gateway.logger.warn(`Cluster ${clusterId} has not posted stats for ${Date.now() - lastStats}ms, marking as unhealthy.`);
        if (activeClusters.delete(clusterId)) {
            gateway.logger.info(`[Resharding] Scheduling a reshard to accommodate cluster ${clusterId} becoming unhealthy.`);
            onClustersChanged();
        }
        unhealthyClusters.set(clusterId, lastStats);
    }

    const statsHandle = await channel.handleStats(message => {
        const cluster = activeClusters.get(message.clusterId) ?? { shards: [] };
        const isNewCluster = cluster.timeout === undefined;
        clearTimeout(cluster.timeout);
        cluster.shards.length = 0;
        cluster.shards.push(...message.shards.values().map(s => ({ id: s.shardId, totalShards: s.totalShards })));

        const lastStats = message.timestamp;
        const timeoutAt = lastStats + clusterTimeoutMs;
        const timeoutAfter = timeoutAt - Date.now();
        if (timeoutAfter < 1)
            return clusterTimedOut(message.clusterId, lastStats);

        activeClusters.set(message.clusterId, cluster);
        cluster.timeout = setTimeout(() => clusterTimedOut(message.clusterId, lastStats), timeoutAfter);

        if (isNewCluster) {
            gateway.logger.info(`[Resharding] Scheduling a reshard to accommodate cluster ${message.clusterId} being available.`);
            onClustersChanged();
        }

        if (unhealthyClusters.delete(message.clusterId))
            gateway.logger.info(`Cluster ${message.clusterId} has become healthy again.`);

    });

    const unhealthySweep = usingInterval(() => {
        const now = Date.now();
        for (const [clusterId, unhealthyTime] of unhealthyClusters) {
            if (!activeTopology.clusters.has(clusterId) && now - unhealthyTime > clusterTimeoutMs * 5) {
                unhealthyClusters.delete(clusterId);
                gateway.logger.warn(`Cluster ${clusterId} has not posted stats for ${now - unhealthyTime}ms, it may be stuck or offline. Issuing kill command incase it is still up.`);
                channel.killWorker({ workerId: clusterId })
                    .catch(err => gateway.logger.error(`Failed to issue kill command to cluster ${clusterId}`, err));
            }
        }
    }, clusterTimeoutMs / 4);

    return {
        async [Symbol.asyncDispose]() {
            await using _0 = statsHandle;
            await using _1 = permitIdentifyHandle;
            using _2 = unhealthySweep;
            using _3 = await lockSharding.enter();
            onClustersChanged.cancel();
            onReshardingComplete.cancel();
        }
    };
}

function assertTimeout(value: number): void {
    if (isNaN(value) || value < 0 || value > ~(1 << 31))
        throw new Error(`${value} is not a valid timeout`);
}

interface ClusterState {
    timeout?: ReturnType<typeof setTimeout>;
    readonly shards: Array<{
        readonly id: number;
        readonly totalShards: number;
    }>;
}

class ClusterTopology {
    readonly #clustersToShards: Map<string, ReadonlySet<number>>;
    readonly #shardToCluster: string[];

    public readonly id: string;
    public readonly clusters: ReadonlySet<string>;
    public readonly shards: number;
    public readonly targetShards: number;

    public constructor(totalShards: number, clusters: ReadonlyMap<string, ClusterState>) {
        if (totalShards <= 0 || totalShards % 1 !== 0)
            throw new RangeError('Number of shards must be a positive integer.');

        this.clusters = new Set(clusters.keys());
        this.targetShards = totalShards;
        this.shards = clusters.size === 0 ? 0 : totalShards;
        this.id = ClusterTopology.#newId();

        const clusterToShards = new Map<string, Set<number>>();
        const shardToCluster: string[] = [];
        if (clusters.size > 0) {
            const allocations = new Map<string, { shards: Set<number>; allocation: number; }>();
            const minimumShardsPerCluster = Math.floor(totalShards / clusters.size);
            // All clusters will have atleast minimumShardsPerCluster shards allocated.
            // When the number of clusters doesnt evenly divide the number of shards, there
            // will be some left over which need allocating, which is this count.
            let unallocated = totalShards % clusters.size;

            // All shards start out as orphaned.
            const orphanedShards = new Set(new Array(totalShards).keys());

            for (const [cluster, state] of clusters) {
                const shards = new Set<number>();
                clusterToShards.set(cluster, shards);

                // Adopt all shards that the cluster currently owns
                state.shards.values()
                    .filter(s => s.totalShards === totalShards)
                    .map(s => s.id)
                    .filter(s => orphanedShards.delete(s))
                    .forEach(s => shards.add(s));

                // Shards should be as balanced between clusters as possible.
                // Because the number of clusters may not evenly divide the number of shards
                // and we want to reduce the number of shard moves, we allocate an extra shard
                // to clusters which already have more than the minimum shards
                let allocation = minimumShardsPerCluster;
                if (shards.size > allocation && unallocated > 0) {
                    allocation++;
                    unallocated--;
                }

                // If the cluster has more shards than it should (e.g. the number of clusters
                // increased or the total number of shards decreased) the cluster abandons shards
                // until it is at or below the target count.
                if (shards.size > allocation) {
                    shards.values()
                        .filter(s => shards.delete(s))
                        .take(shards.size - allocation)
                        .forEach(s => orphanedShards.add(s));
                }
                allocations.set(cluster, { shards, allocation });
            }

            // Allocate any remaining shards to clusters that are at the minimum count.
            allocations.values()
                .filter(x => x.allocation === minimumShardsPerCluster)
                .take(unallocated)
                .forEach(x => x.allocation++);

            for (const [cluster, { shards, allocation }] of allocations) {
                // Adopt enough shards to fill the clusters allocation.
                orphanedShards.values()
                    .filter(s => orphanedShards.delete(s))
                    .take(allocation - shards.size)
                    .forEach(s => shards.add(s));

                // Populate index used to reverse lookup shards.
                for (const shard of shards) {
                    shardToCluster[shard] = cluster;
                }
            }

        }

        this.#clustersToShards = clusterToShards;
        this.#shardToCluster = shardToCluster;
    }

    public getCluster(shard: number): string | undefined {
        return this.#shardToCluster[shard];
    }

    public getShards(cluster: string): ReadonlySet<number> | undefined {
        return this.#clustersToShards.get(cluster);
    }

    static #newId(): string {
        const source = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length: 8 }, () => source[Math.floor(Math.random() * source.length)])
            .join('');
    }

    public static diff(activeTopology: ClusterTopology, targetTopology: ClusterTopology): string {
        const lines: string[] = [];
        lines.push(`Target shards: ${activeTopology.targetShards} => ${targetTopology.targetShards}`);
        lines.push(`Actual shards: ${activeTopology.shards} => ${targetTopology.shards}`);
        lines.push('Shards per cluster:');

        const clusters = new Set([
            ...activeTopology.clusters,
            ...targetTopology.clusters
        ]);
        if (clusters.size === 0) {
            lines.push('  No clusters available');
        } else {
            for (const cluster of clusters) {
                const active = activeTopology.getShards(cluster)?.values().toArray().sort((a, b) => a - b).join(',') ?? 'offline';
                const target = targetTopology.getShards(cluster)?.values().toArray().sort((a, b) => a - b).join(',') ?? 'offline';
                lines.push(`- ${cluster}: [${active}] => [${target}]`);
            }
        }

        return lines.join('\n');
    }

}

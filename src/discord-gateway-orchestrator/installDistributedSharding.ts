import type { DiscordGatewayOrchestrationChannel } from '@blargbot/contracts';
import { BalancedWorkerShardMap, debounce, Iterable, range, Semaphore, usingInterval } from '@blargbot/util';
import type { GatewayManager } from '@discordeno/gateway';

export async function installDistributedSharding(
    options: {
        gateway: GatewayManager;
        channel: DiscordGatewayOrchestrationChannel;
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
    const activeClusterShards = Iterable.from(activeClusters)
        .transform(x => x.map(([workerId, state]) => [
            workerId,
            state.shards.values()
                .filter(s => s.totalShards === gateway.totalShards)
                .map(s => s.id)
        ] as const));
    let activeTopology = new BalancedWorkerShardMap(activeClusterShards, range(gateway.totalShards));
    let targetTopology: typeof activeTopology | undefined;

    const isReshardingInProgress = (): boolean => targetTopology !== undefined;
    const onClustersChanged = debounce(
        () => void (async () => {
            if (isReshardingInProgress())
                return;

            const sessionInfo = await (gateway.resharding.getSessionInfo?.() ?? gateway.connection);

            if (isReshardingInProgress())
                return;

            if (
                activeTopology.shards.size === sessionInfo.shards
                && gateway.totalShards === sessionInfo.shards
                && activeTopology.workers.symmetricDifference(activeClusters).size === 0
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
        targetTopology ??= new BalancedWorkerShardMap(activeClusterShards, range(gateway.totalShards));
        gateway.logger.info('[Resharding] Transitioning cluster shard topology.');
        prepareBuckets.call(gateway);
    };

    gateway.tellWorkerToIdentify = gateway.resharding.tellWorkerToPrepare = async (_, shardId) => {
        const topology = targetTopology ?? activeTopology;
        const clusterId = topology.shardsWorker.get(shardId);
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
        if (topology.workers.size === 0 && activeTopology.workers.size === 0) {
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
        const clusterId = activeTopology.shardsWorker.get(shardId);
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
            if (!activeTopology.workers.has(clusterId) && now - unhealthyTime > clusterTimeoutMs * 5) {
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

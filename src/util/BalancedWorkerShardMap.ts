import { createId } from './createId.js';

export class BalancedWorkerShardMap<WorkerId, ShardId> {
    public readonly id: string;
    public readonly workerShards: ReadonlyMap<WorkerId, ReadonlySet<ShardId>>;
    public readonly shardsWorker: ReadonlyMap<ShardId, WorkerId>;
    public readonly orphanedShards: ReadonlySet<ShardId>;
    public readonly shards: ReadonlySet<ShardId>;
    public readonly workers: ReadonlySet<WorkerId>;

    public constructor(workers: Iterable<readonly [WorkerId, Iterable<ShardId>]>, shards: Iterable<ShardId>) {
        const orphanedShards = new Set(shards);
        const workerMap = new Map(workers);
        const workerToShards = new Map<WorkerId, Set<ShardId>>();
        const shardToWorker = new Map<ShardId, WorkerId>();

        this.id = createId();
        this.orphanedShards = orphanedShards;
        this.shardsWorker = shardToWorker;
        this.workerShards = workerToShards;
        this.shards = new Set(orphanedShards);
        this.workers = new Set(workerMap.keys());

        if (workerMap.size === 0)
            return;

        const allocations = new Map<WorkerId, { shards: Set<ShardId>; allocation: number; }>();
        // All workers will have atleast minimumShardsPerWorker shards allocated.
        // When the number of workers doesnt evenly divide the number of shards, there
        // will be some left over which need allocating, which is this count.
        const minimumShardsPerWorker = Math.floor(orphanedShards.size / workerMap.size);
        let unallocated = orphanedShards.size % workerMap.size;

        for (const [worker, currentShards] of workerMap) {
            // Adopt all shards that the worker currently owns
            const shards = new Set(Iterator.from(currentShards).filter(s => orphanedShards.delete(s)));
            workerToShards.set(worker, shards);

            // Shards should be as balanced between workers as possible.
            // Because the number of workers may not evenly divide the number of shards
            // and we want to reduce the number of shard moves, we allocate an extra shard
            // to workers which already have more than the minimum shards
            let allocation = minimumShardsPerWorker;
            if (shards.size > allocation && unallocated > 0) {
                allocation++;
                unallocated--;
            }

            // If the worker has more shards than it should (e.g. the number of workers
            // increased or the total number of shards decreased) the worker abandons shards
            // until it is at or below the target count.
            if (shards.size > allocation) {
                shards.values()
                    .filter(s => shards.delete(s))
                    .take(shards.size - allocation)
                    .forEach(s => orphanedShards.add(s));
            }
            allocations.set(worker, { shards, allocation });
        }

        // Allocate any remaining shards to workers that are at the minimum count.
        allocations.values()
            .filter(x => x.allocation === minimumShardsPerWorker)
            .take(unallocated)
            .forEach(x => x.allocation++);

        for (const [worker, { shards, allocation }] of allocations) {
            // Adopt enough shards to fill the workers allocation.
            orphanedShards.values()
                .filter(s => orphanedShards.delete(s))
                .take(allocation - shards.size)
                .forEach(s => shards.add(s));

            // Populate index used to reverse lookup shards.
            for (const shard of shards) {
                shardToWorker.set(shard, worker);
            }
        }
    }
}

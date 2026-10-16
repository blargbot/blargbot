import type { PushIterable } from './createPushIterable.js';
import { createPushIterable } from './createPushIterable.js';

export interface PartitionedPushIterable<Item, Partition> {
    getPartition(partition: Partition): AsyncIterable<Item, void, void>;
    push(item: Item): void;
}

export function createPartitionedPushIterable<Item, Partition>(
    partition: (item: Item) => Partition
): PartitionedPushIterable<Item, Partition> {
    const partitions = new Map<Partition, Set<PushIterable<Item>>>();

    return {
        async * getPartition(partition) {
            const iterable = createPushIterable<Item>();
            const iterables = partitions.getOrInsertComputed(partition, () => new Set());
            iterables.add(iterable);
            try {
                yield* iterable.items;
            } finally {
                iterables.delete(iterable);
                if (iterables.size === 0)
                    partitions.delete(partition);
            }
        },
        push(item) {
            const p = partition(item);
            const iterables = partitions.get(p);
            if (iterables === undefined)
                return;

            for (const iterable of iterables)
                iterable.next(item);
        }
    };

}

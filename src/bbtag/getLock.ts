import ReadWriteLock from 'rwlock';

const tagLock = Symbol('The key for a ReadWriteLock');
interface TagLocks extends Map<string, TagLocks> {
    [tagLock]?: ReadWriteLock;
}

const tagLocks: TagLocks = new Map();

export function getLock(...path: string[]): ReadWriteLock {
    let node = tagLocks;

    for (const entry of path) {
        let next = node.get(entry);
        if (next === undefined)
            node.set(entry, next = new Map());
        node = next;
    }

    return node[tagLock] ??= new ReadWriteLock();
}

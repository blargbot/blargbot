import ReadWriteLock from 'rwlock';

const tagLock = Symbol('The key for a ReadWriteLock');
interface TagLocks {
    [key: string]: TagLocks;
    [tagLock]?: ReadWriteLock;
}

const tagLocks: TagLocks = {};

export function get(...path: string[]): ReadWriteLock {
    let node = tagLocks;

    for (const entry of path)
        node = node[entry] ??= {};

    return node[tagLock] ??= new ReadWriteLock();
}
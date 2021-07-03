import ReadWriteLock from 'rwlock';

const TagLock = Symbol('The key for a ReadWriteLock');
interface TagLocks {
    [key: string]: TagLocks;
    [TagLock]?: ReadWriteLock;
}

const tagLocks: TagLocks = {};

export function get(...path: string[]): ReadWriteLock {
    let node = tagLocks;

    for (const entry of path)
        node = node[entry] || (node[entry] = {});

    return node[TagLock] || (node[TagLock] = new ReadWriteLock());
}
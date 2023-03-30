import type { BBTagScope } from '../types.js';

export interface LockService {
    acquire(scope: BBTagScope, name: string, exclusive: boolean): Awaitable<Release>;
}

export interface ILockFactory {
    createLock(id: string): IAsyncLock;
}

export interface IAsyncLock {
    acquire(exclusive: boolean): Awaitable<Release>;
}

type Release = () => Awaitable<void>

export class DefaultLockService implements LockService {
    readonly #locks: Record<string, IAsyncLock | undefined> = {};
    readonly #lockFactory: ILockFactory;

    public constructor(lockFactory: ILockFactory) {
        this.#lockFactory = lockFactory;
    }

    public async acquire(scope: BBTagScope, name: string, exclusive: boolean): Promise<Release> {
        const id = JSON.stringify([scope.ownerId.toString(), scope.scope, name]);
        const lock = this.#locks[id] ??= this.#lockFactory.createLock(id);
        return await lock.acquire(exclusive);
    }
}

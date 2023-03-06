import type { TagVariableScope } from '../types.js';
import { TagVariableType } from '../types.js';

export interface LockService {
    acquire(scope: TagVariableScope, name: string, exclusive: boolean): Awaitable<Release>;
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

    public async acquire(scope: TagVariableScope, name: string, exclusive: boolean): Promise<Release> {
        const id = getLockId(scope, name);
        const lock = this.#locks[id] ??= this.#lockFactory.createLock(id);
        return await lock.acquire(exclusive);
    }
}

function getLockId(scope: TagVariableScope, name: string): string {
    switch (scope.type) {
        case TagVariableType.TEMP: return `${scope.type}_${name}`;
        case TagVariableType.AUTHOR: return `${scope.type}_${scope.authorId}_${name}`;
        case TagVariableType.GLOBAL: return `${scope.type}_${name}`;
        case TagVariableType.GUILD_CC: return `${scope.type}_${scope.guildId}_${name}`;
        case TagVariableType.GUILD_TAG: return `${scope.type}_${scope.guildId}_${name}`;
        case TagVariableType.LOCAL_CC: return `${scope.type}_${scope.guildId}_${scope.name}_${name}`;
        case TagVariableType.LOCAL_TAG: return `${scope.type}_${scope.name}_${name}`;
    }
}

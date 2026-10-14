import type { TagVariableScope } from '@blargbot/domain';
import { TagVariableType } from '@blargbot/domain';
import ReadWriteLock from 'rwlock';

import { memoize } from './memoize.js';

const locks: Record<string, RwLockImpl | undefined> = {};

export function getLock(scope: TagVariableScope | undefined, name: string): RwLock {
    return locks[getLockId(scope, name)] ??= new RwLockImpl();
}

function getLockId(scope: TagVariableScope | undefined, name: string): string {
    switch (scope?.type) {
        case undefined: return `TEMP_${name}`;
        case TagVariableType.AUTHOR: return `${scope.type}_${scope.authorId}_${name}`;
        case TagVariableType.GLOBAL: return `${scope.type}_${name}`;
        case TagVariableType.GUILD_CC: return `${scope.type}_${scope.guildId}_${name}`;
        case TagVariableType.GUILD_TAG: return `${scope.type}_${scope.guildId}_${name}`;
        case TagVariableType.LOCAL_CC: return `${scope.type}_${scope.guildId}_${scope.name}_${name}`;
        case TagVariableType.LOCAL_TAG: return `${scope.type}_${scope.name}_${name}`;
    }
}

export interface RwLock {
    enterWrite(): Promise<AsyncDisposable>;
    enterRead(): Promise<AsyncDisposable>;
}

class RwLockImpl implements RwLock {
    readonly #core = new ReadWriteLock();

    public async enterWrite(): Promise<AsyncDisposable> {
        return await this.#enter('writeLock');
    }

    public async enterRead(): Promise<AsyncDisposable> {
        return await this.#enter('readLock');
    }

    async #enter(type: 'readLock' | 'writeLock'): Promise<AsyncDisposable> {
        const release = await new Promise<() => void>(res => this.#core[type](res));
        return { [Symbol.asyncDispose]: memoize(() => Promise.try(release)) };
    }
}

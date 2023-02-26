import ReadWriteLock from 'rwlock';

import type { TagVariableScope } from './variables/TagVariableScope.js';
import { TagVariableType } from './variables/TagVariableType.js';

const locks: Record<string, ReadWriteLock | undefined> = {};

export function getLock(scope: TagVariableScope, name: string): ReadWriteLock {
    return locks[getLockId(scope, name)] ??= new ReadWriteLock();
}

function getLockId(scope: TagVariableScope, name: string): string {
    switch (scope.type) {
        case TagVariableType.TEMP: return `TEMP_${name}`;
        case TagVariableType.AUTHOR: return `${scope.type}_${scope.authorId}_${name}`;
        case TagVariableType.GLOBAL: return `${scope.type}_${name}`;
        case TagVariableType.GUILD_CC: return `${scope.type}_${scope.guildId}_${name}`;
        case TagVariableType.GUILD_TAG: return `${scope.type}_${scope.guildId}_${name}`;
        case TagVariableType.LOCAL_CC: return `${scope.type}_${scope.guildId}_${scope.name}_${name}`;
        case TagVariableType.LOCAL_TAG: return `${scope.type}_${scope.name}_${name}`;
    }
}

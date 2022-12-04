import type { TagVariableScope} from '@blargbot/domain/models/index.js';
import { TagVariableType } from '@blargbot/domain/models/index.js';
import ReadWriteLock from 'rwlock';

const locks: Record<string, ReadWriteLock | undefined> = {};

export function getLock(scope: TagVariableScope | undefined, name: string): ReadWriteLock {
    return locks[getLockId(scope, name)] ??= new ReadWriteLock();
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

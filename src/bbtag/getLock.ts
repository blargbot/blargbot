import { TagVariableScope, TagVariableType } from '@blargbot/domain/models';
import ReadWriteLock from 'rwlock';

const locks: Record<`${TagVariableType | ``}_${string}_${string}_${string}`, ReadWriteLock> = {};

export function getLock(scope: TagVariableScope | undefined, name: string): ReadWriteLock {
    return locks[`${scope?.type ?? ``}_${scope?.entityId ?? ``}_${scope?.name ?? ``} _${name}`] ??= new ReadWriteLock();
}

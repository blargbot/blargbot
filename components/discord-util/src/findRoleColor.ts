import { selectFirstRoleProp } from './selectFirstRoleProp.js';

export function findRoleColor<Id, Role extends { id: Id; position: number; color: number; }>(roleIds: Iterable<Id>, roles: Iterable<Role>): number {
    return selectFirstRoleProp(roleIds, roles, r => r.color === 0 ? undefined : r.color) ?? 0;
}

import { selectFirstRoleProp } from './selectFirstRoleProp.js';

export function findRolePosition<Id, Role extends { id: Id; position: number; }>(roleIds: Iterable<Id>, roles: Iterable<Role>): number {
    return selectFirstRoleProp(roleIds, roles, r => r.position) ?? 0;
}

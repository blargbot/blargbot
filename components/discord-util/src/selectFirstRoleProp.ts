export function selectFirstRoleProp<Id, Role extends { id: Id; position: number; }, Result>(
    roleIds: Iterable<Id>,
    allRoles: Iterable<Role>,
    selector: (role: Role) => Result | undefined
): Result | undefined {
    const ids = new Set(roleIds);
    const sorted = [...allRoles].sort((a, b) => b.position - a.position);
    for (const role of sorted) {
        if (!ids.has(role.id))
            continue;

        const value = selector(role);
        if (value !== undefined)
            return value;
    }
    return undefined;
}

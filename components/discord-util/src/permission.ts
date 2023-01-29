export const permission = {
    discover,
    compute
};

function compute(roles: Iterable<{ permissions: string | bigint; }>, overrides: Iterable<PermissionOverwrite> = []): bigint {
    let result = 0n;

    for (const role of roles)
        result |= BigInt(role.permissions);

    for (const override of [...overrides].sort((a, b) => b.type - a.type)) {
        result &= ~BigInt(override.deny);
        result |= BigInt(override.allow);
    }

    if ((result & admin) !== 0n)
        return all;

    return result;
}

function discover(userId: string, ownerId: string, roleIds: string[], allRoles: Array<{ id: string; permissions: string | bigint; }>, allOverrides: PermissionOverwrite[] = []): bigint {
    if (userId === ownerId)
        return all;

    const roleIdSet = new Set(roleIds);
    const typeChecks = {
        [OverwriteType.ROLE]: roleIdSet.has.bind(roleIdSet),
        [OverwriteType.MEMBER]: (x: string | undefined) => x === userId
    };

    return compute(
        allRoles.filter(r => roleIdSet.has(r.id)),
        allOverrides.filter(o => typeChecks[o.type](o.id))
    );
}

interface PermissionOverwrite {
    id?: string;
    type: 0 | 1;
    allow: string | bigint;
    deny: string | bigint;
}

const admin = 8n;
const all = ~(-1n << 64n);

const enum OverwriteType {
    ROLE = 0,
    MEMBER = 1
}

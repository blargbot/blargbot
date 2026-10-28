import { DiscordPermissions } from '../enums.js';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from '../subtags/index.js';
import type { GetMemberPermissionsFeature } from '../subtags/types.js';

export async function getEditRoleDetails(
    guildId: string,
    userIds: string[],
    features: GetMemberPermissionsFeature & ListMemberRolesFeature & ListGuildRolesFeature
): Promise<{
    topRoleId: string | undefined;
    topRoleIndex: number;
    roleIndexMap: ReadonlyMap<string, number>;
    permissions: DiscordPermissions;
}> {
    const guildRoles = await features.listGuildRoles(guildId);
    const roleIndexMap = new Map(guildRoles.map((r, i) => [r, i]));
    if (userIds.length === 0)
        return { topRoleId: undefined, topRoleIndex: 0, roleIndexMap, permissions: DiscordPermissions.NONE };
    const userValues = await Promise.all(userIds.map(async userId => {
        const permissions = await features.getMemberPermissions(guildId, userId);
        if (!permissions.hasAny('ADMINISTRATOR', 'MANAGE_ROLES'))
            return { topRoleId: undefined, topRoleIndex: 0, permissions };
        const roleIds = await features.listMemberRoles(guildId, userId);
        const topRoleId = roleIds?.at(-1);
        if (topRoleId === undefined)
            return { topRoleId: undefined, topRoleIndex: 0, permissions };
        return { topRoleId, topRoleIndex: roleIndexMap.get(topRoleId) ?? 0, permissions };
    }));

    return {
        ...userValues.reduce((p, c) => c.topRoleIndex < p.topRoleIndex ? c : p),
        roleIndexMap,
        permissions: userValues.map(x => x.permissions).reduce((p, c) => p.has('ADMINISTRATOR') ? c : c.has('ADMINISTRATOR') ? p : p.and(c))
    };
}

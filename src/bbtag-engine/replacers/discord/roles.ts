import { bbtagArray } from '../../bbtagArray.js';
import { BBTagRuntimeError, NotABooleanError, NotANumberError } from '../../BBTagRuntimeError.js';
import { defineReplacer } from '../../defineReplacer.js';
import { parse } from '../../parse.js';
import { toSetAsync } from '../../toCollectionAsync.js';
import { FailedToDeleteRoleNoPermsError, FailedToEditRoleNoPermsError, LegacyRoleNotFoundError, RoleNotFoundError, UserNotFoundError } from './errors.js';
import type * as Locals from './locals.js';
import { getManageableRoles, isQuiet } from './util.js';

export const roleAddReplacer = defineReplacer<Locals.GuildMemberAddRolesLocals>(['roleAdd', 'addRole'], {
    parameters: ['role', 'user?', 'quiet?'],
    returns: 'boolean',
    execute: async function roleAdd(ctx, [{ value: roleStr }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const manageableRoles = await getManageableRoles(ctx, 'Author cannot add roles', r => r.toString());
        const allRoles = await toSetAsync(ctx.locals.discord.listAllRoles(), r => r.toString());
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, 'false') });
        const userRoles = await toSetAsync(ctx.locals.discord.listUserRoles(userId));
        const roleStrs = bbtagArray.deserialize(roleStr)?.v.map(parse.string) ?? [roleStr];
        const validRoles = new Set<bigint>();
        for (const role of roleStrs) {
            if (!allRoles.has(role))
                continue;
            if (!manageableRoles.has(role))
                throw new BBTagRuntimeError('Role above author');
            validRoles.add(BigInt(role));
        }
        if (validRoles.size === 0)
            throw new RoleNotFoundError(roleStr);

        const newRoles = userRoles.union<bigint>(validRoles);
        if (newRoles.size === userRoles.size)
            return false;

        return await ctx.locals.discord.setUserRoles(userId, newRoles);
    }
});
export const roleRemoveReplacer = defineReplacer<Locals.GuildMemberRemoveRolesLocals>(['roleRemove', 'removeRole'], {
    parameters: ['role', 'user?', 'quiet?'],
    returns: 'boolean',
    execute: async function roleAdd(ctx, [{ value: roleStr }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const manageableRoles = await getManageableRoles(ctx, 'Author cannot remove roles', r => r.toString());
        const allRoles = await toSetAsync(ctx.locals.discord.listAllRoles(), r => r.toString());
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, 'false') });
        const userRoles = await toSetAsync(ctx.locals.discord.listUserRoles(userId));
        const roleStrs = bbtagArray.deserialize(roleStr)?.v.map(parse.string) ?? [roleStr];
        const validRoles = new Set<bigint>();
        for (const role of roleStrs) {
            if (!allRoles.has(role))
                continue;
            if (!manageableRoles.has(role))
                throw new BBTagRuntimeError('Role above author');
            validRoles.add(BigInt(role));
        }
        if (validRoles.size === 0)
            throw new RoleNotFoundError(roleStr);

        const newRoles = userRoles.difference(validRoles);
        if (newRoles.size === userRoles.size)
            return false;

        return await ctx.locals.discord.setUserRoles(userId, newRoles);
    }
});
export const roleColorReplacer = defineReplacer<Locals.GuildRoleColorLocals>('roleColor', {
    parameters: ['role', 'quiet?'],
    returns: 'string',
    execute: async function roleColor(ctx, [{ value: roleStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError.withQuiet(quiet, '') });
        const color = await ctx.locals.discord.getRoleColor(roleId);
        return color.toString(16).padStart(6, '0');
    }
});
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const roleCreateReplacerFactory = (options: { getColorByName: (value: string) => number | null; }) => defineReplacer<Locals.GuildRoleCreateLocals>('roleCreate', {
    parameters: ['name', 'color?:000000', 'permissions?:0', 'mentionable?:false', 'hoisted?:false'],
    returns: 'id',
    execute: async function roleCreate(ctx, [{ value: name }, { value: colorStr }, { value: permissionsStr }, { value: mentionableStr }, { value: hoistedStr }]) {
        await getManageableRoles(ctx, 'Author cannot create roles');
        const rolePerms = parse.bigint(permissionsStr);
        if (rolePerms === null)
            throw new BBTagRuntimeError('Permission not a number', `${JSON.stringify(permissionsStr)} is not a number`);
        if ((rolePerms & ctx.locals.discord.authorPermissions) !== rolePerms)
            throw new BBTagRuntimeError('Author missing requested permissions');

        const roleId = await ctx.locals.discord.createRole({
            name,
            color: parse.color(colorStr, { getByName: options.getColorByName }),
            permissions: rolePerms,
            mentionable: parse.boolean(mentionableStr, { fallback: false }),
            hoist: parse.boolean(hoistedStr, { fallback: false })
        });
        if (roleId === null)
            throw new BBTagRuntimeError('Failed to create role: no perms');

        return roleId;
    }
});
export const roleDeleteReplacer = defineReplacer<Locals.GuildRoleDeleteLocals>('roleDelete', {
    parameters: ['role', 'quiet?'],
    returns: 'nothing',
    execute: async function roleDelete(ctx, [{ value: roleStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const manageableRoles = await getManageableRoles(ctx, 'Author cannot delete roles');
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError.withQuiet(quiet, '') });
        if (!manageableRoles.has(roleId))
            throw new BBTagRuntimeError('Role above author');

        if (!await ctx.locals.discord.deleteRole(roleId))
            throw new (FailedToDeleteRoleNoPermsError.withQuiet(quiet, ''))();
    }
});
export const roleIdReplacer = defineReplacer<Locals.QueryDiscordRoleLocals>('roleId', {
    parameters: ['role', 'quiet?'],
    returns: 'id',
    execute: async function roleId(ctx, [{ value: roleStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        return await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError.withQuiet(quiet, '') });
    }
});
export const roleNameReplacer = defineReplacer<Locals.GuildRoleNameLocals>('roleName', {
    parameters: ['role', 'quiet?'],
    returns: 'string',
    execute: async function roleName(ctx, [{ value: roleStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.discord.getRoleName(roleId);
    }
});
export const rolePermissionsReplacer = defineReplacer<Locals.GuildRolePermissionsLocals>(['rolePermissions', 'rolePerms'], {
    parameters: ['role', 'quiet?'],
    returns: 'string',
    execute: async function rolePermissions(ctx, [{ value: roleStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError.withQuiet(quiet, '') });
        return (await ctx.locals.discord.getRolePermissions(roleId)).toString();
    }
});
export const rolePositionReplacer = defineReplacer<Locals.GuildRolePositionLocals>(['rolePosition', 'rolePos'], {
    parameters: ['role', 'quiet?'],
    returns: 'number',
    execute: async function rolePosition(ctx, [{ value: roleStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.discord.getRolePosition(roleId);
    }
});
export const roleMembersReplacer = defineReplacer<Locals.GuildRoleMembersLocals>('roleMembers', {
    parameters: ['role', 'quiet?'],
    returns: 'id[]',
    execute: async function roleMembers(ctx, [{ value: roleStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.discord.listRoleMembers(roleId);
    }
});
export const roleSizeReplacer = defineReplacer<Locals.GuildRoleSizeLocals>(['roleSize', 'inRole'], {
    parameters: ['role'],
    returns: 'number',
    execute: async function roleSize(ctx, [{ value: roleStr }]) {
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: true, throw: RoleNotFoundError });
        return await ctx.locals.discord.getRoleMemberCount(roleId);
    }
});
export const roleMentionReplacer = defineReplacer<Locals.GuildRoleMentionLocals>('roleMention', {
    parameters: ['role', 'quiet?', 'noPing?:false'],
    returns: 'string',
    execute: async function roleMention(ctx, [{ value: roleStr }, { value: quietStr }, { value: noPingStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const noPing = parse.boolean(noPingStr, { throw: NotABooleanError });
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError.withQuiet(quiet, '') });
        if (!noPing)
            ctx.locals.discord.mentions.roles.add(roleId);
        return `<@&${roleId}>`;
    }
});
export const rolesReplacer = defineReplacer<Locals.GuildRolesLocals>('roles', {
    parameters: ['user?', 'quiet?'],
    returns: 'id[]',
    execute: async function roles(ctx, [{ value: userStr, exists: hasUser }, { value: quietStr }]) {
        if (!hasUser)
            return await ctx.locals.discord.listAllRoles();

        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.discord.listUserRoles(userId);
    }
});
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const roleSetColorReplacerFactory = (options: { getColorByName: (value: string) => number | null; }) => defineReplacer<Locals.GuildRoleSetColorLocals>('roleSetColor', {
    parameters: ['role', 'color?:000000', 'quiet?'],
    returns: 'nothing', //TODO output like true/false
    execute: async function roleSetColor(ctx, [{ value: roleStr }, { value: colorStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const manageableRoles = await getManageableRoles(ctx, 'Author cannot edit roles');
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: LegacyRoleNotFoundError });
        if (!manageableRoles.has(roleId))
            throw new BBTagRuntimeError('Role above author');

        const color = parse.color(colorStr, { getByName: options.getColorByName });
        if (!await ctx.locals.discord.setRoleColor(roleId, color))
            throw new (FailedToEditRoleNoPermsError.withQuiet(quiet, ''))();
    }
});
export const roleSetMentionableReplacer = defineReplacer<Locals.GuildRoleSetMentionableLocals>('roleSetMentionable', {
    parameters: ['role', 'value?:true', 'quiet?'],
    returns: 'nothing', //TODO output like true/false
    execute: async function roleSetMentionable(ctx, [{ value: roleStr }, { value: valueStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const manageableRoles = await getManageableRoles(ctx, 'Author cannot edit roles');
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: LegacyRoleNotFoundError });
        if (!manageableRoles.has(roleId))
            throw new BBTagRuntimeError('Role above author');

        if (!await ctx.locals.discord.setRoleMentionable(roleId, parse.boolean(valueStr, { fallback: false })))
            throw new (FailedToEditRoleNoPermsError.withQuiet(quiet, ''))();
    }
});
export const roleSetPositionReplacer = defineReplacer<Locals.GuildRoleSetPositionLocals>(['roleSetPosition', 'roleSetPos'], {
    parameters: ['role', 'position', 'quiet?'],
    returns: 'boolean',
    execute: async function roleSetPosition(ctx, [{ value: roleStr }, { value: positionStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const manageableRoles = await getManageableRoles(ctx, 'Author cannot edit roles');
        const position = parse.int(positionStr, { throw: NotANumberError });
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError });
        const [topRole] = manageableRoles.values().take(1).toArray();
        if (!manageableRoles.has(roleId))
            throw new BBTagRuntimeError('Role above author');
        const topPosition = await ctx.locals.discord.getRolePosition(topRole);
        if (position >= topPosition)
            throw new BBTagRuntimeError('Desired position above author');

        if (!await ctx.locals.discord.setRolePosition(roleId, position))
            throw new (FailedToEditRoleNoPermsError.withQuiet(quiet, 'false'))();
        return true;
    }
});
export const roleSetNameReplacer = defineReplacer<Locals.GuildRoleSetNameLocals>('roleSetName', {
    parameters: ['role', 'name', 'quiet?'],
    returns: 'nothing', //TODO output like true/false
    execute: async function roleSetName(ctx, [{ value: roleStr }, { value: name }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const manageableRoles = await getManageableRoles(ctx, 'Author cannot edit roles');
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError });
        if (!manageableRoles.has(roleId))
            throw new BBTagRuntimeError('Role above author');

        if (!await ctx.locals.discord.setRoleName(roleId, name))
            throw new (FailedToEditRoleNoPermsError.withQuiet(quiet, ''))();
    }
});
export const roleSetPermissionsReplacer = defineReplacer<Locals.GuildRoleSetPermissionsLocals>(['roleSetPermissions', 'roleSetPerms'], {
    parameters: ['role', 'permissions?:0', 'quiet?'],
    returns: 'nothing', //TODO output like true/false
    execute: async function roleSetPermissions(ctx, [{ value: roleStr }, { value: permissionsStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const manageableRoles = await getManageableRoles(ctx, 'Author cannot edit roles');
        const roleId = await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: LegacyRoleNotFoundError });
        if (!manageableRoles.has(roleId))
            throw new BBTagRuntimeError('Role above author');

        const permissions = (parse.bigint(permissionsStr) ?? 0n) & ctx.locals.discord.authorPermissions;

        if (!await ctx.locals.discord.setRolePermissions(roleId, permissions))
            throw new (FailedToEditRoleNoPermsError.withQuiet(quiet, ''))();
    }
});

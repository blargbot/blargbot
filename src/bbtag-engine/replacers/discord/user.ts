import { bbtagArray } from '../../bbtagArray.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { BBTagRuntimeError } from '../../BBTagRuntimeError.js';
import type { CompiledBBTagReplacer } from '../../compilation/CompiledBBTagReplacer.js';
import { defineReplacer } from '../../defineReplacer.js';
import { parse } from '../../parse.js';
import { toSetAsync } from '../../toCollectionAsync.js';
import type { VariablesLocals } from '../locals.js';
import { RoleNotFoundError } from './errors.js';
import type { DiscordMentionsLocals, DiscordUserAvatarLocals, DiscordUserCreatedDateLocals, DiscordUserIsBotLocals, DiscordUserLocals, DiscordUserNameLocals, DiscordUserNicknameLocals, DiscordUserStatusLocals, DiscordUserTimezoneLocals, DmUserLocals, GuildMemberActivityLocals, GuildMemberBanLocals, GuildMemberBoostingLocals, GuildMemberJoinedDateLocals, GuildMemberKickLocals, GuildMemberListLocals, GuildMemberRolesLocals, GuildMemberTimeoutLocals, GuildMemberWarningLocals, GuildRolesLocals, IsDiscordStaffLocals } from './locals.js';
import type { EmbedParser } from './util.js';

function toAuthorizer(noPerms: string): 'tag' | 'user' {
    return noPerms !== '' ? 'tag' : 'user';
}
async function getUserId(ctx: BBTagContext<DiscordUserLocals>, userStr: string, quietStr = '', quietFallback?: string): Promise<bigint> {
    const quiet = quietStr !== '';
    return userStr !== ''
        ? await ctx.locals.queryUser(userStr, { noLookup: quiet, throw: !quiet || (quietFallback ?? true) })
        : ctx.locals.userId;
}

export const banReplacer = defineReplacer<GuildMemberBanLocals>('ban', {
    parameters: ['user', 'daysToDelete?:1', 'reason?', 'timeToUnban?', 'noPerms?'],
    returns: 'boolean|number',
    execute: async function ban(ctx, [{ value: userStr }, { value: daysToDeleteStr }, { value: reason }, { value: durationStr }, { value: noPerms }]) {
        const userId = await ctx.locals.queryUser(userStr, { noLookup: true, global: true, throw: true });
        const daysToDelete = parse.int(daysToDeleteStr, { throw: 'false' });
        let duration: number | undefined;

        if (durationStr !== '')
            duration = parse.duration(durationStr);

        if (reason === '')
            reason = 'Tag Ban';

        if (!await ctx.locals.banGuildMember({
            userId,
            authorizer: toAuthorizer(noPerms),
            daysToDelete,
            duration,
            reason
        })) {
            return false;
        }
        return duration ?? true;
    }
});
export const unbanReplacer = defineReplacer<GuildMemberBanLocals>('unban', {
    parameters: ['user', 'reason?', 'noPerms?'],
    returns: 'boolean',
    execute: async function unban(ctx, [{ value: userStr }, { value: reason }, { value: noPerms }]) {
        const userId = await ctx.locals.queryUser(userStr, { throw: true, global: true });
        if (reason === '')
            reason = 'Tag Unban';
        return await ctx.locals.unbanGuildMember({
            userId,
            authorizer: toAuthorizer(noPerms),
            reason
        });
    }
});
export const dmReplacerFactory = (options: { parseEmbed: EmbedParser; }): CompiledBBTagReplacer<DmUserLocals> => defineReplacer('dm', {
    parameters: ['user', 'message', 'embed?'],
    returns: 'nothing',
    execute: async function dm(ctx, [{ value: userStr }, { value: messageStr }, { value: embedStr, exists: hasEmbed }]) {
        const user = await ctx.locals.queryUser(userStr, { throw: true });
        const nsfw = ctx.locals.nsfw.value;
        let embeds;
        let content;
        if (nsfw !== undefined) {
            embeds = undefined;
            content = nsfw;
        } else if (hasEmbed) {
            embeds = options.parseEmbed(embedStr);
            content = messageStr;
        } else {
            embeds = options.parseEmbed(messageStr, { allowMalformed: false });
            content = embeds === undefined ? messageStr : undefined;
        }

        try {
            await ctx.locals.createDM(user, content, embeds);
        } catch {
            throw new BBTagRuntimeError('Could not send DM');
        }
    }
});
export const isStaffReplacer = defineReplacer<IsDiscordStaffLocals>(['isStaff', 'isMod'], {
    parameters: ['user?', 'quiet?'],
    returns: 'boolean',
    execute: async function isStaff(ctx, [{ value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        return await ctx.locals.isUserStaff(userId);
    }
});
export const isUserBoostingReplacer = defineReplacer<GuildMemberBoostingLocals>('isUserBoosting', {
    parameters: ['user?', 'quiet?'],
    returns: 'boolean',
    execute: async function isUserBoosting(ctx, [{ value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        return await ctx.locals.getGuildMemberBoostSince(userId) !== null;
    }
});
export const userBoostDateReplacer = defineReplacer<GuildMemberBoostingLocals>('userBoostDate', {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userBoostDate(ctx, [{ value: format }, { value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        const date = await ctx.locals.getGuildMemberBoostSince(userId);
        if (date === null)
            throw new BBTagRuntimeError('User not boosting');
        return date.format(format);
    }
});
export const kickReplacer = defineReplacer<GuildMemberKickLocals>('kick', {
    parameters: ['user', 'reason?', 'noPerms?'],
    returns: 'string',
    execute: async function kick(ctx, [{ value: userStr }, { value: reason }, { value: noPerms }]) {
        const userId = await ctx.locals.queryUser(userStr, { noLookup: true /* TODO why? */, throw: true });
        if (reason === '')
            reason = 'Tag Kick';

        await ctx.locals.kickGuildMember({
            userId,
            authorizer: toAuthorizer(noPerms),
            reason
        });
        return 'Success'; //TODO true/false response
    }
});

export const warnReplacer = defineReplacer<GuildMemberWarningLocals>('warn', {
    parameters: ['user?', 'count?:1', 'reason?'],
    returns: 'number',
    execute: async function warn(ctx, [{ value: userStr }, { value: countStr }, { value: reason }]) {
        const userId = await getUserId(ctx, userStr, '');
        const count = parse.int(countStr, { throw: true });
        return await ctx.locals.warnGuildMember(userId, count, reason !== '' ? reason : 'Tag Warning');
    }
});
export const pardonReplacer = defineReplacer<GuildMemberWarningLocals>('pardon', {
    parameters: ['user?', 'count?:1', 'reason?'],
    returns: 'number',
    execute: async function pardon(ctx, [{ value: userStr }, { value: countStr }, { value: reason }]) {
        const userId = await getUserId(ctx, userStr, '');
        const count = parse.int(countStr, { throw: true });
        return await ctx.locals.pardonGuildMember(userId, count, reason !== '' ? reason : 'Tag Pardon');
    }
});
export const warningsReplacer = defineReplacer<GuildMemberWarningLocals>('warnings', {
    parameters: ['user?', 'quiet?'],
    returns: 'number',
    execute: async function warnings(ctx, [{ value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr);
        return await ctx.locals.getGuildMemberWarnings(userId);
    }
});
export const randomUserReplacer = defineReplacer<GuildMemberListLocals>(['randomUser', 'randUser'], {
    parameters: [],
    returns: 'id',
    execute: async function randomUser(ctx) {
        const userIds = [];
        for await (const user of await ctx.locals.getAllGuildMembers())
            userIds.push(user);
        return userIds[Math.floor(Math.random() * userIds.length)];
    }
});
export const timeoutReplacer = defineReplacer<GuildMemberTimeoutLocals>('timeout', {
    parameters: ['user', 'duration', 'reason?', 'noPerms?'],
    returns: 'string',
    execute: async function timeout(ctx, [{ value: userStr }, { value: durationStr }, { value: reason }, { value: noPerms }]) {
        const duration = parse.duration(durationStr, { throw: true });
        const userId = await ctx.locals.queryUser(userStr, { /* TODO why? */ noLookup: true, throw: true });

        if (reason === '')
            reason = 'Tag Timeout';

        if (await ctx.locals.timeoutGuildMember({
            userId,
            authorizer: toAuthorizer(noPerms),
            reason,
            duration
        })) {
            return 'Success';
        }

        if (duration === 0)
            throw new BBTagRuntimeError('User is not timed out', `<@${userId}> is not timed out!`);
        throw new BBTagRuntimeError('User is already timed out', `<@${userId}> is already timed out!`);
    }
});
const userActivityTypes = {
    0: 'playing',
    1: 'streaming',
    2: 'listening',
    3: 'watching',
    4: 'custom',
    5: 'competing'
};
export const userActivityReplacer = defineReplacer<GuildMemberActivityLocals>(['userActivity', 'userGame'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userActivity(ctx, [{ value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        return (await ctx.locals.getGuildMemberActivity(userId))?.name ?? 'nothing';
    }
});
export const userActivityTypeReplacer = defineReplacer<GuildMemberActivityLocals>(['userActivityType', 'userGameType'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userActivityType(ctx, [{ value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        const type = (await ctx.locals.getGuildMemberActivity(userId))?.type;
        if (type === undefined || !Object.hasOwn(userActivityTypes, type))
            return '';
        return userActivityTypes[type];
    }
});
export const userNameReplacer = defineReplacer<DiscordUserNameLocals>('userName', {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userName(ctx, [{ value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        return await ctx.locals.getUserName(userId);
    }
});
export const userIdReplacer = defineReplacer<DiscordUserLocals>('userId', {
    parameters: ['user?', 'quiet?'],
    returns: 'id',
    execute: async function userId(ctx, [{ value: userStr }, { value: quietStr }]) {
        return await getUserId(ctx, userStr, quietStr, '');
    }
});
export const userIsBotReplacer = defineReplacer<DiscordUserIsBotLocals>(['userIsBot', 'userBot'], {
    parameters: ['user?', 'quiet?'],
    returns: 'boolean',
    execute: async function userIsBot(ctx, [{ value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        return await ctx.locals.getIsUserBot(userId);
    }
});
export const userStatusReplacer = defineReplacer<DiscordUserStatusLocals>('userStatus', {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userStatus(ctx, [{ value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        return await ctx.locals.getUserStatus(userId);
    }
});
export const userTimezoneReplacer = defineReplacer<DiscordUserTimezoneLocals>('userTimezone', {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userTimezone(ctx, [{ value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        return await ctx.locals.getUserTimezone(userId) ?? 'UTC';
    }
});
export const userTimeoutReplacer = defineReplacer<GuildMemberTimeoutLocals>(['userTimeout', 'timedoutUntil', 'userTimedoutUntil', 'memberTimeout', 'memberTimedoutUntil'], {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userTimeout(ctx, [{ value: format }, { value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        const date = await ctx.locals.getGuildMemberTimeout(userId);
        if (date === null)
            throw new BBTagRuntimeError('User not timed out');
        return date.format(format);
    }
});
export const userAvatarReplacer = defineReplacer<DiscordUserAvatarLocals>(['userAvatar', 'userAvatar.global'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userAvatar(ctx, args) {
        const [{ value: userStr }, { value: quietStr }] = args;
        const globalOnly = args.subtagName.toLowerCase().endsWith('.global');
        const userId = await getUserId(ctx, userStr, quietStr, '');
        const url = await ctx.locals.getUserAvatar({ userId, globalOnly });
        return url.toString();
    }
});
export const userNicknameReplacer = defineReplacer<DiscordUserNicknameLocals>(['userNickname', 'userNickname.global', 'userNick', 'userNick.global'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userNickname(ctx, args) {
        const [{ value: userStr }, { value: quietStr }] = args;
        const globalOnly = args.subtagName.toLowerCase().endsWith('.global');
        const userId = await getUserId(ctx, userStr, quietStr, '');
        return await ctx.locals.getNickname({ userId, globalOnly });
    }
});
export const userCreatedAtReplacer = defineReplacer<DiscordUserCreatedDateLocals>('userCreatedAt', {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userCreatedAt(ctx, [{ value: format }, { value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        const date = await ctx.locals.getUserCreatedDate(userId);
        return date.format(format);
    }
});
export const userJoinedAtReplacer = defineReplacer<GuildMemberJoinedDateLocals>('userJoinedAt', {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userJoinedAt(ctx, [{ value: format }, { value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        const date = await ctx.locals.getGuildMemberJoinedDate(userId);
        return date.format(format);
    }
});
export const userRolesReplacer = defineReplacer<GuildMemberRolesLocals>('userRoles', {
    parameters: ['user?', 'quiet?'],
    returns: 'id[]',
    execute: async function userRoles(ctx, [{ value: userStr }, { value: quietStr }]) {
        const userId = await getUserId(ctx, userStr, quietStr, '');
        return await ctx.locals.getGuildMemberRoles(userId);
    }
});
async function assertValidRoles(ctx: BBTagContext<GuildRolesLocals>, roleIds: Iterable<string>, errorDisplay?: string): Promise<void> {
    const knownRoles = await toSetAsync(ctx.locals.getAllRoles(), x => x.toString());
    for (const roleId of roleIds) {
        if (!knownRoles.has(roleId)) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(errorDisplay);
        }
    }
}
export const userHasAnyRoleReplacer = defineReplacer<GuildMemberRolesLocals & GuildRolesLocals>(['userHasAnyRole', 'userHasRole', 'hasAnyRole', 'hasRole'], {
    parameters: ['roleIds', 'user?', 'quiet?'],
    returns: 'boolean',
    execute: async function userHasAnyRole(ctx, [{ value: roleIdsStr }, { value: userStr }, { value: quietStr }]) {
        const arr = bbtagArray.deserialize(roleIdsStr) ?? { v: [roleIdsStr] };
        const roleIds = new Set(arr.v.map(x => parse.string(x)));
        const userId = await getUserId(ctx, userStr, quietStr, 'false');

        await assertValidRoles(ctx, roleIds, quietStr === '' ? undefined : 'false');

        for await (const roleId of await ctx.locals.getGuildMemberRoles(userId)) {
            if (roleIds.has(roleId.toString()))
                return true;
        }
        return false;
    }
});
export const userHasAllRolesReplacer = defineReplacer<GuildMemberRolesLocals & GuildRolesLocals>(['userHasAllRoles', 'userHasRoles', 'hasAllRoles', 'hasRoles'], {
    parameters: ['roleIds', 'user?', 'quiet?'],
    returns: 'boolean',
    execute: async function userHasAnyRoles(ctx, [{ value: roleIdsStr }, { value: userStr }, { value: quietStr }]) {
        const arr = bbtagArray.deserialize(roleIdsStr) ?? { v: [roleIdsStr] };
        const roleIds = new Set(arr.v.map(x => parse.string(x)));
        const userId = await getUserId(ctx, userStr, quietStr, 'false');

        await assertValidRoles(ctx, roleIds, quietStr === '' ? undefined : 'false');

        for await (const roleId of await ctx.locals.getGuildMemberRoles(userId))
            roleIds.delete(roleId.toString());
        return roleIds.size === 0;
    }
});
export const userMentionReplacer = defineReplacer<DiscordMentionsLocals & DiscordUserLocals>('userMention', {
    parameters: ['user?', 'quiet?', 'noPing?:false'],
    returns: 'string',
    execute: async function userMention(ctx, [{ value: userStr }, { value: quietStr }, { value: noPingStr }]) {
        const noPing = parse.boolean(noPingStr, { throw: true });
        const userId = await getUserId(ctx, userStr, quietStr, '');
        if (!noPing)
            ctx.locals.mentions.users.add(userId);
        return `<@${userId}>`;
    }
});
export const userSetRolesReplacer = defineReplacer<GuildMemberRolesLocals & GuildRolesLocals & VariablesLocals>(['userSetRoles', 'setRoles'], {
    parameters: ['roleArray?', 'user?', 'quiet?'],
    returns: 'boolean',
    execute: async function userSetRoles(ctx, [{ value: roleStr }, { value: userStr }, { value: quietStr }]) {
        const assignableRoles = await toSetAsync(ctx.locals.getAssignableRoles());
        if (assignableRoles.size === 0)
            throw new BBTagRuntimeError('Author cannot remove roles');

        const userId = await getUserId(ctx, userStr, quietStr, 'false');
        const quiet = quietStr !== '';
        const roleArr = await bbtagArray.deserializeOrGetArray(ctx, roleStr !== '' ? roleStr : '[]', { throw: !quiet || 'false' });

        const parsedRoles: bigint[] = [];
        for (const roleStr of roleArr.v.map(v => parse.string(v))) {
            parsedRoles.push(await ctx.locals.queryRole(roleStr, { noLookup: quiet, throw: !quiet || 'false' }));
        }

        return await ctx.locals.setGuildMemberRoles(userId, parsedRoles);
    }
});
export const userSetNicknameReplacer = defineReplacer<DiscordUserNicknameLocals & GuildRolesLocals>(['userSetNickname', 'setNickname', 'setNick', 'userSetNick'], {
    parameters: ['nick', 'user?'],
    returns: 'nothing',
    execute: async function userSetNickname(ctx, [{ value: nickname }, { value: userStr }]) {
        const userId = await getUserId(ctx, userStr);
        await ctx.locals.setGuildMemberNickname(userId, nickname);
    }
});

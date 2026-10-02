import { bbtagArray } from '../../bbtagArray.js';
import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagRuntimeThrowable } from '../../BBTagRuntimeError.js';
import { BBTagRuntimeError, InvalidDurationError, NotABooleanError, NotAnArrayError, NotANumberError } from '../../BBTagRuntimeError.js';
import type { CompiledBBTagReplacer } from '../../compilation/CompiledBBTagReplacer.js';
import { defineReplacer } from '../../defineReplacer.js';
import { parse } from '../../parse.js';
import { isEmptyAsync, toArrayAsync, toSetAsync } from '../../toCollectionAsync.js';
import { RoleNotFoundError, UserNotFoundError } from './errors.js';
import type * as Locals from './locals.js';
import type { EmbedParser } from './util.js';
import { isQuiet, toAuthorizer } from './util.js';

export const banReplacer = defineReplacer<Locals.GuildMemberBanLocals>('ban', {
    parameters: ['user', 'daysToDelete?:1', 'reason?', 'timeToUnban?', 'noPerms?'],
    returns: 'boolean|number',
    execute: async function ban(ctx, [{ value: userStr }, { value: daysToDeleteStr }, { value: reason }, { value: durationStr }, { value: noPerms }]) {
        const userId = await ctx.locals.discord.queryUser(userStr, { global: true, throw: UserNotFoundError });
        const daysToDelete = parse.int(daysToDeleteStr, { throw: NotANumberError.withDisplay('false') });
        let duration: number | null = null;

        if (durationStr !== '')
            duration = parse.duration(durationStr);

        if (reason === '')
            reason = 'Tag Ban';

        if (!await ctx.locals.discord.ban({
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
export const unbanReplacer = defineReplacer<Locals.GuildMemberBanLocals>('unban', {
    parameters: ['user', 'reason?', 'noPerms?'],
    returns: 'boolean',
    execute: async function unban(ctx, [{ value: userStr }, { value: reason }, { value: noPerms }]) {
        const userId = await ctx.locals.discord.queryUser(userStr, { global: true, throw: UserNotFoundError });
        if (reason === '')
            reason = 'Tag Unban';
        return await ctx.locals.discord.unban({
            userId,
            authorizer: toAuthorizer(noPerms),
            reason
        });
    }
});
export const dmReplacerFactory = (options: { parseEmbed: EmbedParser; }): CompiledBBTagReplacer<Locals.DiscordSendDmLocals> => defineReplacer('dm', {
    parameters: ['user', 'message', 'embed?'],
    returns: 'nothing',
    execute: async function dm(ctx, [{ value: userStr }, { value: messageStr }, { value: embedStr, exists: hasEmbed }]) {
        const user = await ctx.locals.discord.queryUser(userStr, { throw: UserNotFoundError });
        const nsfw = ctx.locals.nsfw.value;
        let embeds;
        let content;
        if (nsfw !== null) {
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
            await ctx.locals.discord.sendDM(user, content, embeds);
        } catch {
            throw new BBTagRuntimeError('Could not send DM');
        }
    }
});
export const isStaffReplacer = defineReplacer<Locals.IsDiscordStaffLocals>(['isStaff', 'isMod'], {
    parameters: ['user?', 'quiet?'],
    returns: 'boolean',
    execute: async function isStaff(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.isStaff(userId);
    }
});
export const isUserBoostingReplacer = defineReplacer<Locals.GuildMemberBoostingLocals>('isUserBoosting', {
    parameters: ['user?', 'quiet?'],
    returns: 'boolean',
    execute: async function isUserBoosting(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.discord.getBoostTimestamp(userId) !== null;
    }
});
export const userBoostDateReplacer = defineReplacer<Locals.GuildMemberBoostingLocals>('userBoostDate', {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userBoostDate(ctx, [{ value: format }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        const date = await ctx.locals.discord.getBoostTimestamp(userId);
        if (date === null)
            throw new BBTagRuntimeError('User not boosting');
        return date.format(format);
    }
});
export const kickReplacer = defineReplacer<Locals.GuildMemberKickLocals>('kick', {
    parameters: ['user', 'reason?', 'noPerms?'],
    returns: 'string',
    execute: async function kick(ctx, [{ value: userStr }, { value: reason }, { value: noPerms }]) {
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: true /* TODO why? */, throw: UserNotFoundError });
        if (reason === '')
            reason = 'Tag Kick';

        await ctx.locals.discord.kick({
            userId,
            authorizer: toAuthorizer(noPerms),
            reason
        });
        return 'Success'; //TODO true/false response
    }
});

export const warnReplacer = defineReplacer<Locals.GuildMemberWarningLocals>('warn', {
    parameters: ['user?', 'count?:1', 'reason?'],
    returns: 'number',
    execute: async function warn(ctx, [{ value: userStr }, { value: countStr }, { value: reason }]) {
        const userId = await ctx.locals.discord.queryUser(userStr, { throw: UserNotFoundError });
        const count = parse.int(countStr, { throw: NotANumberError });
        return await ctx.locals.warnings.add(userId, count, reason !== '' ? reason : 'Tag Warning');
    }
});
export const pardonReplacer = defineReplacer<Locals.GuildMemberWarningLocals>('pardon', {
    parameters: ['user?', 'count?:1', 'reason?'],
    returns: 'number',
    execute: async function pardon(ctx, [{ value: userStr }, { value: countStr }, { value: reason }]) {
        const userId = await ctx.locals.discord.queryUser(userStr, { throw: UserNotFoundError });
        const count = parse.int(countStr, { throw: NotANumberError });
        return await ctx.locals.warnings.remove(userId, count, reason !== '' ? reason : 'Tag Pardon');
    }
});
export const warningsReplacer = defineReplacer<Locals.GuildMemberWarningLocals>('warnings', {
    parameters: ['user?', 'quiet?'],
    returns: 'number',
    execute: async function warnings(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError });
        return await ctx.locals.warnings.get(userId);
    }
});
export const randomUserReplacer = defineReplacer<Locals.GuildMemberListLocals>(['randomUser', 'randUser'], {
    parameters: [],
    returns: 'id',
    execute: async function randomUser(ctx) {
        const userIds = await toArrayAsync(ctx.locals.discord.listAllMembers());
        return userIds[Math.floor(Math.random() * userIds.length)];
    }
});
export const timeoutReplacer = defineReplacer<Locals.GuildMemberTimeoutLocals>('timeout', {
    parameters: ['user', 'duration', 'reason?', 'noPerms?'],
    returns: 'string',
    execute: async function timeout(ctx, [{ value: userStr }, { value: durationStr }, { value: reason }, { value: noPerms }]) {
        const duration = parse.duration(durationStr, { throw: InvalidDurationError });
        const userId = await ctx.locals.discord.queryUser(userStr, { /* TODO why? */ quiet: true, throw: UserNotFoundError });

        if (reason === '')
            reason = 'Tag Timeout';

        if (await ctx.locals.discord.userTimeout.set({
            userId,
            authorizer: toAuthorizer(noPerms),
            reason,
            duration
        })) {
            return 'Success';
        }

        if (duration === 0)
            throw new BBTagRuntimeError('User is not timed out', `${userStr} is not timed out!`);
        throw new BBTagRuntimeError('User is already timed out', `${userStr} is already timed out!`);
    }
});
export const userTimeoutReplacer = defineReplacer<Locals.GuildMemberTimeoutLocals>(['userTimeout', 'timedoutUntil', 'userTimedoutUntil', 'memberTimeout', 'memberTimedoutUntil'], {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userTimeout(ctx, [{ value: format }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        const date = await ctx.locals.discord.userTimeout.get(userId);
        if (date === null)
            throw new BBTagRuntimeError('User not timed out');
        return date.format(format);
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
export const userActivityReplacer = defineReplacer<Locals.GuildMemberActivityLocals>(['userActivity', 'userGame'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userActivity(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        return (await ctx.locals.discord.getActivity(userId))?.name ?? 'nothing';
    }
});
export const userActivityTypeReplacer = defineReplacer<Locals.GuildMemberActivityLocals>(['userActivityType', 'userGameType'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userActivityType(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        const type = (await ctx.locals.discord.getActivity(userId))?.type;
        if (type === undefined || !Object.hasOwn(userActivityTypes, type))
            return '';
        return userActivityTypes[type];
    }
});
export const userNameReplacer = defineReplacer<Locals.DiscordUserNameLocals>('userName', {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userName(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.discord.getUsername(userId);
    }
});
export const userIdReplacer = defineReplacer<Locals.QueryDiscordUserLocals>('userId', {
    parameters: ['user?', 'quiet?'],
    returns: 'id',
    execute: async function userId(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        return await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
    }
});
export const userIsBotReplacer = defineReplacer<Locals.DiscordUserIsBotLocals>(['userIsBot', 'userBot'], {
    parameters: ['user?', 'quiet?'],
    returns: 'boolean',
    execute: async function userIsBot(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.discord.isBot(userId);
    }
});
export const userStatusReplacer = defineReplacer<Locals.DiscordUserStatusLocals>('userStatus', {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userStatus(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.discord.getStatus(userId);
    }
});
export const userTimezoneReplacer = defineReplacer<Locals.DiscordUserTimezoneLocals>('userTimezone', {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userTimezone(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.getUserTimezone(userId) ?? 'UTC';
    }
});
export const userAvatarReplacer = defineReplacer<Locals.DiscordUserAvatarLocals>(['userAvatar', 'userAvatar.global'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userAvatar(ctx, args) {
        const [{ value: userStr }, { value: quietStr }] = args;
        const globalOnly = args.subtagName.toLowerCase().endsWith('.global');
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        const url = await ctx.locals.discord.getAvatarUrl({ userId, globalOnly });
        return url.toString();
    }
});
export const userNicknameReplacer = defineReplacer<Locals.DiscordUserNicknameLocals>(['userNickname', 'userNickname.global', 'userNick', 'userNick.global'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userNickname(ctx, args) {
        const [{ value: userStr }, { value: quietStr }] = args;
        const globalOnly = args.subtagName.toLowerCase().endsWith('.global');
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.discord.getNickname({ userId, globalOnly });
    }
});
export const userSetNicknameReplacer = defineReplacer<Locals.GuildMemberSetNicknameLocals>(['userSetNickname', 'setNickname', 'setNick', 'userSetNick'], {
    parameters: ['nick', 'user?'],
    returns: 'nothing',
    execute: async function userSetNickname(ctx, [{ value: nickname }, { value: userStr }]) {
        const userId = await ctx.locals.discord.queryUser(userStr, { throw: UserNotFoundError });
        if (!await ctx.locals.discord.setNickname(userId, nickname))
            throw new BBTagRuntimeError('Could not change nickname');
    }
});
export const userCreatedAtReplacer = defineReplacer<Locals.DiscordUserCreatedDateLocals>('userCreatedAt', {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userCreatedAt(ctx, [{ value: format }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        const date = ctx.locals.discord.getTimestamp(userId);
        return date.format(format);
    }
});
export const userJoinedAtReplacer = defineReplacer<Locals.GuildMemberJoinedDateLocals>('userJoinedAt', {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userJoinedAt(ctx, [{ value: format }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        const date = await ctx.locals.discord.getJoinedTimestamp(userId);
        return date.format(format);
    }
});
export const userRolesReplacer = defineReplacer<Locals.GuildMemberRolesLocals>('userRoles', {
    parameters: ['user?', 'quiet?'],
    returns: 'id[]',
    execute: async function userRoles(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        return await ctx.locals.discord.listUserRoles(userId);
    }
});
async function assertValidRoles(ctx: BBTagContext<Locals.GuildAllRolesLocals>, roleIds: Iterable<string>, error: BBTagRuntimeThrowable<[string]>): Promise<void> {
    const knownRoles = await toSetAsync(ctx.locals.discord.listAllRoles(), x => x.toString());
    for (const roleId of roleIds) {
        if (!knownRoles.has(roleId)) {
            throw new error(roleId);
        }
    }
}
export const userHasAnyRoleReplacer = defineReplacer<Locals.GuildMemberHasRolesLocals>(['userHasAnyRole', 'userHasRole', 'hasAnyRole', 'hasRole'], {
    parameters: ['roleIds', 'user?', 'quiet?'],
    returns: 'boolean',
    execute: async function userHasAnyRole(ctx, [{ value: roleIdsStr }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const arr = bbtagArray.deserialize(roleIdsStr) ?? { v: [roleIdsStr] };
        const roleIds = new Set(arr.v.map(x => parse.string(x)));
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, 'false') });

        await assertValidRoles(ctx, roleIds, RoleNotFoundError.withQuiet(quiet, 'false'));

        for await (const roleId of await ctx.locals.discord.listUserRoles(userId)) {
            if (roleIds.has(roleId.toString()))
                return true;
        }
        return false;
    }
});
export const userHasAllRolesReplacer = defineReplacer<Locals.GuildMemberHasRolesLocals>(['userHasAllRoles', 'userHasRoles', 'hasAllRoles', 'hasRoles'], {
    parameters: ['roleIds', 'user?', 'quiet?'],
    returns: 'boolean',
    execute: async function userHasAnyRoles(ctx, [{ value: roleIdsStr }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const arr = bbtagArray.deserialize(roleIdsStr) ?? { v: [roleIdsStr] };
        const roleIds = new Set(arr.v.map(x => parse.string(x)));
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, 'false') });

        await assertValidRoles(ctx, roleIds, RoleNotFoundError.withQuiet(quiet, 'false'));

        for await (const roleId of await ctx.locals.discord.listUserRoles(userId))
            roleIds.delete(roleId.toString());
        return roleIds.size === 0;
    }
});
export const userMentionReplacer = defineReplacer<Locals.DiscordUserMentionLocals>('userMention', {
    parameters: ['user?', 'quiet?', 'noPing?:false'],
    returns: 'string',
    execute: async function userMention(ctx, [{ value: userStr }, { value: quietStr }, { value: noPingStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const noPing = parse.boolean(noPingStr, { throw: NotABooleanError });
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, '') });
        if (!noPing)
            ctx.locals.discord.mentions.users.add(userId);
        return `<@${userId}>`;
    }
});
export const userSetRolesReplacer = defineReplacer<Locals.GuildMemberSetRolesLocals>(['userSetRoles', 'setRoles'], {
    parameters: ['roleArray?', 'user?', 'quiet?'],
    returns: 'boolean',
    execute: async function userSetRoles(ctx, [{ value: roleStr }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        if (await isEmptyAsync(ctx.locals.discord.listManageableRoles()))
            throw new BBTagRuntimeError('Author cannot remove roles');

        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: UserNotFoundError.withQuiet(quiet, 'false') });
        const roleArr = await bbtagArray.deserializeOrGetArray(ctx, roleStr !== '' ? roleStr : '[]', { throw: NotAnArrayError.withQuiet(quiet, 'false') });

        const parsedRoles: bigint[] = [];
        for (const roleStr of roleArr.v.map(v => parse.string(v))) {
            parsedRoles.push(await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: RoleNotFoundError.withQuiet(quiet, 'false') }));
        }

        return await ctx.locals.discord.setUserRoles(userId, parsedRoles);
    }
});

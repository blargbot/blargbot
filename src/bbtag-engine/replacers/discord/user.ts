import moment from 'moment-timezone';

import { bbtagArray } from '../../bbtagArray.js';
import { BBTagRuntimeError, InvalidDurationError, NotABooleanError, NotAnArrayError, NotANumberError } from '../../BBTagRuntimeError.js';
import type { CompiledBBTagReplacer } from '../../compilation/CompiledBBTagReplacer.js';
import { defineReplacer } from '../../defineReplacer.js';
import { parse } from '../../parse.js';
import { isEmptyAsync, toArrayAsync, toSetAsync } from '../../toCollectionAsync.js';
import { DiscordPermissions } from './enums.js';
import { RoleNotFoundError, UserNotFoundError } from './errors.js';
import type * as Locals from './locals.js';
import type { EmbedParser } from './util.js';
import { hasAnyPermissions, hasHigherRole, isQuiet } from './util.js';

const banPermissions = new DiscordPermissions('ADMINISTRATOR', 'BAN_MEMBERS');
export const banReplacer = defineReplacer<Locals.GuildMemberBanLocals>('ban', {
    parameters: ['target', 'daysToDelete?:1', 'reason?', 'timeToUnban?', 'noPerms?'],
    returns: 'boolean|number',
    execute: async function ban(ctx, [{ value: targetStr }, { value: daysToDeleteStr }, { value: reason }, { value: durationStr }, { value: noPerms }]) {
        const targetId = await ctx.locals.discord.queryUser(targetStr, { global: true, throw: UserNotFoundError });
        const notANumber = NotANumberError.withDisplay('false');
        const daysToDelete = parse.int(daysToDeleteStr, { throw: notANumber });
        let duration: number | null = null;

        if (durationStr !== '')
            duration = parse.duration(durationStr);

        if (reason === '')
            reason = 'Tag Ban';

        const { authorizerId, userId, botId, ownerId, banOverrides } = ctx.locals.discord;
        const moderatorId = noPerms === '' ? userId : authorizerId;
        if (!await hasAnyPermissions(ctx, botId, banPermissions))
            throw new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to ban users!');
        if (targetId === ownerId)
            throw new BBTagRuntimeError('User has no permissions', 'You cannot ban the guild owner!');
        if (targetId === moderatorId)
            throw new BBTagRuntimeError('User has no permissions', 'You cannot ban yourself!');
        if (targetId === botId)
            throw new BBTagRuntimeError('Bot has no permissions', 'I cannot ban myself!');
        if (moderatorId !== ownerId && moderatorId !== botId) {
            if (!await hasAnyPermissions(ctx, moderatorId, banOverrides, banPermissions))
                throw new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to ban users!');
            if (!await hasHigherRole(ctx, moderatorId, targetId))
                throw new BBTagRuntimeError('User has no permissions', 'You can only ban users whos top role is below your top role!');
        }
        if (!await hasHigherRole(ctx, botId, targetId))
            throw new BBTagRuntimeError('Bot has no permissions', 'I can only ban users whos top role is below my top role!');

        return await ctx.locals.discord.ban({ userId: targetId, moderatorId, daysToDelete, duration, reason })
            ? duration ?? true
            : false;
    }
});
export const unbanReplacer = defineReplacer<Locals.GuildMemberBanLocals>('unban', {
    parameters: ['target', 'reason?', 'noPerms?'],
    returns: 'boolean',
    execute: async function unban(ctx, [{ value: targetStr }, { value: reason }, { value: noPerms }]) {
        const targetId = await ctx.locals.discord.queryUser(targetStr, { global: true, throw: UserNotFoundError });
        if (reason === '')
            reason = 'Tag Unban';

        const { authorizerId, userId, botId, ownerId, banOverrides } = ctx.locals.discord;
        const moderatorId = noPerms === '' ? userId : authorizerId;
        if (!await hasAnyPermissions(ctx, botId, banPermissions))
            throw new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to unban users!');
        if (moderatorId !== ownerId && moderatorId !== botId && !await hasAnyPermissions(ctx, moderatorId, banOverrides, banPermissions))
            throw new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to unban users!');

        return await ctx.locals.discord.unban({ userId: targetId, moderatorId, reason });
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
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        return await ctx.locals.isStaff(userId);
    }
});
export const isUserBoostingReplacer = defineReplacer<Locals.GuildMemberBoostingLocals>('isUserBoosting', {
    parameters: ['user?', 'quiet?'],
    returns: 'boolean',
    execute: async function isUserBoosting(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        return await ctx.locals.discord.getBoostTimestamp(userId) !== null;
    }
});
export const userBoostDateReplacer = defineReplacer<Locals.GuildMemberBoostingLocals>('userBoostDate', {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userBoostDate(ctx, [{ value: format }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        const date = await ctx.locals.discord.getBoostTimestamp(userId)
            ?? new BBTagRuntimeError('User not boosting').throw();
        return moment.utc(date).format(format);
    }
});
const kickPermissions = new DiscordPermissions('ADMINISTRATOR', 'KICK_MEMBERS');
export const kickReplacer = defineReplacer<Locals.GuildMemberKickLocals>('kick', {
    parameters: ['user', 'reason?', 'noPerms?'],
    returns: 'string',
    execute: async function kick(ctx, [{ value: userStr }, { value: reason }, { value: noPerms }]) {
        const targetId = await ctx.locals.discord.queryUser(userStr, { quiet: true /* TODO why? */, throw: UserNotFoundError });
        if (reason === '')
            reason = 'Tag Kick';

        const { authorizerId, userId, botId, ownerId, kickOverrides } = ctx.locals.discord;
        const moderatorId = noPerms === '' ? userId : authorizerId;
        if (!await hasAnyPermissions(ctx, botId, kickPermissions))
            throw new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!');
        if (targetId === ownerId)
            throw new BBTagRuntimeError('User has no permissions', 'You cannot kick the guild owner!');
        if (targetId === moderatorId)
            throw new BBTagRuntimeError('User has no permissions', 'You cannot kick yourself!');
        if (targetId === botId)
            throw new BBTagRuntimeError('Bot has no permissions', 'I cannot kick myself!');
        if (moderatorId !== ownerId && moderatorId !== botId) {
            if (!await hasAnyPermissions(ctx, moderatorId, kickOverrides, kickPermissions))
                throw new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!');
            if (!await hasHigherRole(ctx, moderatorId, targetId))
                throw new BBTagRuntimeError('User has no permissions', 'You can only kick users whos top role is below your top role!');
        }
        if (!await hasHigherRole(ctx, botId, targetId))
            throw new BBTagRuntimeError('Bot has no permissions', 'I can only kick users whos top role is below my top role!');

        if (!await ctx.locals.discord.kick({ userId: targetId, moderatorId, reason }))
            throw new BBTagRuntimeError('Kick failed');
        return 'Success';
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
const timeoutPermissions = new DiscordPermissions('ADMINISTRATOR', 'MODERATE_MEMBERS');
export const timeoutReplacer = defineReplacer<Locals.GuildMemberTimeoutLocals>('timeout', {
    parameters: ['user', 'duration', 'reason?', 'noPerms?'],
    returns: 'string',
    execute: async function timeout(ctx, [{ value: targetStr }, { value: durationStr }, { value: reason }, { value: noPerms }]) {
        const duration = parse.duration(durationStr, { throw: InvalidDurationError });
        const targetId = await ctx.locals.discord.queryUser(targetStr, { /* TODO why? */ quiet: true, throw: UserNotFoundError });

        if (reason === '')
            reason = 'Tag Timeout';

        const { authorizerId, userId, botId, ownerId, timeoutOverrides } = ctx.locals.discord;
        const moderatorId = noPerms === '' ? userId : authorizerId;
        if (!await hasAnyPermissions(ctx, botId, timeoutPermissions))
            throw new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to timeout users!');
        if (targetId === ownerId)
            throw new BBTagRuntimeError('User has no permissions', 'You cannot timeout the guild owner!');
        if (targetId === moderatorId)
            throw new BBTagRuntimeError('User has no permissions', 'You cannot timeout yourself!');
        if (targetId === botId)
            throw new BBTagRuntimeError('Bot has no permissions', 'I cannot timeout myself!');
        if (await hasAnyPermissions(ctx, targetId, DiscordPermissions.ADMINISTRATOR))
            throw new BBTagRuntimeError('User has no permissions', 'Administrators cannot be timed out!');
        if (moderatorId !== ownerId && moderatorId !== botId) {
            if (!await hasAnyPermissions(ctx, moderatorId, timeoutOverrides, timeoutPermissions))
                throw new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to timeout users!');
            if (!await hasHigherRole(ctx, moderatorId, targetId))
                throw new BBTagRuntimeError('User has no permissions', 'You can only timeout users whos top role is below your top role!');
        }
        if (!await hasHigherRole(ctx, botId, targetId))
            throw new BBTagRuntimeError('Bot has no permissions', 'I can only timeout users whos top role is below my top role!');

        if (await ctx.locals.discord.setUserTimeout({
            userId: targetId,
            moderatorId,
            reason,
            duration
        }))
            return 'Success';

        throw duration === 0
            ? new BBTagRuntimeError('User is not timed out', `${targetStr} is not timed out!`)
            : new BBTagRuntimeError('User is already timed out', `${targetStr} is already timed out!`);
    }
});
export const userTimeoutReplacer = defineReplacer<Locals.GuildMemberTimeoutLocals>(['userTimeout', 'timedoutUntil', 'userTimedoutUntil', 'memberTimeout', 'memberTimedoutUntil'], {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userTimeout(ctx, [{ value: format }, { value: userStr, exists: hasUser }, { value: quietStr }]) {
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        const date = await ctx.locals.discord.getUserTimeout(userId)
            ?? new BBTagRuntimeError('User not timed out').throw();
        return moment.utc(date).format(format);
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
    execute: async function userActivity(ctx, [{ value: userStr, exists: hasUser }, { value: quietStr }]) {
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        return (await ctx.locals.discord.getActivity(userId))?.name ?? 'nothing';
    }
});
export const userActivityTypeReplacer = defineReplacer<Locals.GuildMemberActivityLocals>(['userActivityType', 'userGameType'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userActivityType(ctx, [{ value: userStr, exists: hasUser }, { value: quietStr }]) {
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        const type = (await ctx.locals.discord.getActivity(userId))?.type;
        if (type === undefined || !Object.hasOwn(userActivityTypes, type))
            return '';
        return userActivityTypes[type];
    }
});
export const userNameReplacer = defineReplacer<Locals.DiscordUserNameLocals>('userName', {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userName(ctx, [{ value: userStr, exists: hasUser }, { value: quietStr }]) {
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        return await ctx.locals.discord.getUsername(userId);
    }
});
export const userIdReplacer = defineReplacer<Locals.QueryDiscordUserLocals>('userId', {
    parameters: ['user?', 'quiet?'],
    returns: 'id',
    execute: async function userId(ctx, [{ value: userStr, exists: hasUser }, { value: quietStr }]) {
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        return await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
    }
});
export const userIsBotReplacer = defineReplacer<Locals.DiscordUserIsBotLocals>(['userIsBot', 'userBot'], {
    parameters: ['user?', 'quiet?'],
    returns: 'boolean',
    execute: async function userIsBot(ctx, [{ value: userStr, exists: hasUser }, { value: quietStr }]) {
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        return await ctx.locals.discord.isBot(userId);
    }
});
export const userStatusReplacer = defineReplacer<Locals.DiscordUserStatusLocals>('userStatus', {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userStatus(ctx, [{ value: userStr, exists: hasUser }, { value: quietStr }]) {
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        return await ctx.locals.discord.getStatus(userId);
    }
});
export const userTimezoneReplacer = defineReplacer<Locals.DiscordUserTimezoneLocals>('userTimeZone', {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userTimezone(ctx, [{ value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        return await ctx.locals.getUserTimezone(userId) ?? 'UTC';
    }
});
export const userAvatarReplacer = defineReplacer<Locals.DiscordUserAvatarLocals>(['userAvatar', 'userAvatar.global'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userAvatar(ctx, args) {
        const [{ value: userStr, exists: hasUser }, { value: quietStr }] = args;
        const globalOnly = args.subtagName.toLowerCase().endsWith('.global');
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        const url = await ctx.locals.discord.getAvatarUrl({ userId, globalOnly });
        return url.toString();
    }
});
export const userNicknameReplacer = defineReplacer<Locals.DiscordUserNicknameLocals>(['userNickname', 'userNickname.global', 'userNick', 'userNick.global'], {
    parameters: ['user?', 'quiet?'],
    returns: 'string',
    execute: async function userNickname(ctx, args) {
        const [{ value: userStr, exists: hasUser }, { value: quietStr }] = args;
        const globalOnly = args.subtagName.toLowerCase().endsWith('.global');
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
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
    execute: async function userCreatedAt(ctx, [{ value: format }, { value: userStr, exists: hasUser }, { value: quietStr }]) {
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        const date = ctx.locals.discord.getTimestamp(userId);
        return moment.utc(date).format(format);
    }
});
export const userJoinedAtReplacer = defineReplacer<Locals.GuildMemberJoinedDateLocals>('userJoinedAt', {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user?', 'quiet?'],
    returns: 'string',
    execute: async function userJoinedAt(ctx, [{ value: format }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        const date = await ctx.locals.discord.getJoinedTimestamp(userId);
        return moment.utc(date).format(format);
    }
});
export const userRolesReplacer = defineReplacer<Locals.GuildMemberRolesLocals>('userRoles', {
    parameters: ['user?', 'quiet?'],
    returns: 'id[]',
    execute: async function userRoles(ctx, [{ value: userStr, exists: hasUser }, { value: quietStr }]) {
        const quiet = !hasUser || isQuiet(ctx, quietStr);
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
        return await ctx.locals.discord.listUserRoles(userId);
    }
});
export const userHasAnyRoleReplacer = defineReplacer<Locals.GuildMemberHasRolesLocals>(['userHasAnyRole', 'userHasRole', 'hasAnyRole', 'hasRole'], {
    parameters: ['roleIds', 'user?', 'quiet?'],
    returns: 'boolean',
    execute: async function userHasAnyRole(ctx, [{ value: roleIdsStr }, { value: userStr }, { value: quietStr }]) {
        const quiet = isQuiet(ctx, quietStr);
        const userNotFound = UserNotFoundError.withQuiet(quiet, 'false');
        const roleNotFound = RoleNotFoundError.withQuiet(quiet, 'false');
        const arr = bbtagArray.deserialize(roleIdsStr) ?? { v: [roleIdsStr] };
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: userNotFound });
        const allRoles = await toSetAsync(ctx.locals.discord.listAllRoles(), roleId => roleId.toString());

        const roleIds = new Set(arr.v.map(x => parse.string(x)).filter(v => allRoles.has(v)));
        if (roleIds.size === 0)
            throw new roleNotFound(roleIdsStr);

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
        const userNotFound = UserNotFoundError.withQuiet(quiet, 'false');
        const roleNotFound = RoleNotFoundError.withQuiet(quiet, 'false');
        const arr = bbtagArray.deserialize(roleIdsStr) ?? { v: [roleIdsStr] };
        const roleIds = new Set(arr.v.map(x => parse.string(x)));
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: userNotFound });
        const allRoles = await toSetAsync(ctx.locals.discord.listAllRoles(), x => x.toString());

        for (const roleId of roleIds) {
            if (!allRoles.has(roleId)) {
                throw new roleNotFound(roleId);
            }
        }

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
        const notFound = UserNotFoundError.withQuiet(quiet, '');
        const noPing = parse.boolean(noPingStr, { throw: NotABooleanError });
        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: notFound });
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

        const userNotFound = UserNotFoundError.withQuiet(quiet, 'false');
        const roleNotFound = RoleNotFoundError.withQuiet(quiet, 'false');
        const notAnArray = NotAnArrayError.withQuiet(quiet, 'false');

        const userId = await ctx.locals.discord.queryUser(userStr, { quiet: quiet, throw: userNotFound });
        const roleArr = await bbtagArray.deserializeOrGetArray(ctx, roleStr !== '' ? roleStr : '[]', { throw: notAnArray });

        const parsedRoles: bigint[] = [];
        for (const roleStr of roleArr.v.map(v => parse.string(v))) {
            parsedRoles.push(await ctx.locals.discord.queryRole(roleStr, { quiet: quiet, throw: roleNotFound }));
        }

        return await ctx.locals.discord.setUserRoles(userId, parsedRoles);
    }
});

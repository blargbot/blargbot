import z from 'zod';

import { BBTagRuntimeError, NotANumberError } from '../../BBTagRuntimeError.js';
import { defineReplacer } from '../../defineReplacer.js';
import { parse } from '../../parse.js';
import { bigintish, booleanish, enumish, integerish, jsonSchema } from '../../schemas.js';
import { AutoArchiveDuration, ChannelType, DiscordPermissions, ForumLayoutType, ForumSortOrder, PermissionOverwriteType, VideoQualityMode } from './enums.js';
import { ChannelNotFoundError, FailedToCreateChannelNoPermsError, FailedToEditChannelNoPermsError, FailedToMoveChannelNoPermsError, LegacyChannelNotFoundError } from './errors.js';
import type * as Locals from './locals.js';
import { hasAnyPermissionsIn, isQuiet } from './util.js';

export const channelCategoriesReplacer = defineReplacer<Locals.GuildChannelListLocals>(['channelCategories', 'categories'], {
    parameters: [],
    returns: 'id[]',
    execute: async function channelCategories(ctx) {
        return await ctx.locals.discord.listChannels(ChannelType.GUILD_CATEGORY);
    }
});
export const channelCategoryReplacer = defineReplacer<Locals.GuildChannelCategoryLocals>(['channelCategory', 'category'], {
    parameters: ['channel?', 'quiet?'],
    returns: 'id',
    execute: async function channelCategory(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
        const notFound = ChannelNotFoundError.withQuiet(quiet, '');
        const noParent = BBTagRuntimeError.withDisplay('');
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
        return await ctx.locals.discord.getChannelCategory(channelId)
            ?? new noParent('Channel has no parent').throw();
    }
});
export const channelIdReplacer = defineReplacer<Locals.QueryDiscordChannelLocals>('channelId', {
    parameters: ['channel?', 'quiet?'],
    returns: 'id',
    execute: async function channelId(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
        const notFound = ChannelNotFoundError.withQuiet(quiet, '');
        return await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
    }
});
export const lastMessageIdReplacer = defineReplacer<Locals.GuildChannelLastMessageIdLocals>('lastMessageId', {
    parameters: ['channel?'],
    returns: 'id|nothing',
    execute: async function lastMessageId(ctx, [{ value: channelStr }]) {
        const notFound = ChannelNotFoundError;
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { throw: notFound });
        const channelType = await ctx.locals.discord.getChannelType(channelId)
            ?? new notFound(channelStr).throw();
        if (!isText(channelType))
            throw new BBTagRuntimeError('Channel must be a textable channel');
        return await ctx.locals.discord.getLastMessageId(channelId) ?? undefined;
    }
});
export const channelTypeReplacer = defineReplacer<Locals.GuildChannelTypeLocals>('channelType', {
    parameters: ['channel?', 'quiet?'],
    returns: 'string',
    execute: async function channelType(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
        const notFound = ChannelNotFoundError.withQuiet(quiet, '');
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
        const type = await ctx.locals.discord.getChannelType(channelId)
            ?? new notFound(channelStr).throw();
        switch (type) {
            case ChannelType.GUILD_TEXT:
                return 'text';
            case ChannelType.DM:
                return 'dm';
            case ChannelType.GUILD_VOICE:
                return 'voice';
            case ChannelType.GROUP_DM:
                return 'group-dm';
            case ChannelType.GUILD_CATEGORY:
                return 'category';
            case ChannelType.GUILD_ANNOUNCEMENT:
                return 'news';
            case ChannelType.ANNOUNCEMENT_THREAD:
                return 'news-thread';
            case ChannelType.PUBLIC_THREAD:
                return 'public-thread';
            case ChannelType.PRIVATE_THREAD:
                return 'private-thread';
            case ChannelType.GUILD_STAGE_VOICE:
                return 'stage-voice';
            case ChannelType.GUILD_DIRECTORY:
                return 'directory';
            case ChannelType.GUILD_FORUM:
                return 'forum';
            case ChannelType.GUILD_MEDIA:
                return 'media';
            default:
                return type.toString();
        }
    }
});
export const channelIsCategoryReplacer = defineReplacer<Locals.GuildChannelTypeLocals>(['channelIsCategory', 'isCategory'], {
    parameters: ['channel?', 'quiet?'],
    returns: 'boolean',
    execute: async function channelIsCategory(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
        const notFound = ChannelNotFoundError.withQuiet(quiet, '');
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
        const type = await ctx.locals.discord.getChannelType(channelId)
            ?? new notFound(channelStr).throw();
        return isCategory(type);
    }
});
export const channelIsTextReplacer = defineReplacer<Locals.GuildChannelTypeLocals>(['channelIsText', 'isText'], {
    parameters: ['channel?', 'quiet?'],
    returns: 'boolean',
    execute: async function channelIsText(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
        const notFound = ChannelNotFoundError.withQuiet(quiet, '');
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
        const type = await ctx.locals.discord.getChannelType(channelId)
            ?? new notFound(channelStr).throw();
        return isText(type);
    }
});
export const channelIsThreadReplacer = defineReplacer<Locals.GuildChannelTypeLocals>(['channelIsThread', 'isThread'], {
    parameters: ['channel?', 'quiet?'],
    returns: 'boolean',
    execute: async function channelIsThread(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
        const notFound = ChannelNotFoundError.withQuiet(quiet, '');
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
        const type = await ctx.locals.discord.getChannelType(channelId)
            ?? new notFound(channelStr).throw();
        return isThread(type);
    }
});
export const channelIsVoiceReplacer = defineReplacer<Locals.GuildChannelTypeLocals>(['channelIsVoice', 'isVoice'], {
    parameters: ['channel?', 'quiet?'],
    returns: 'boolean',
    execute: async function channelIsVoice(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
        const notFound = ChannelNotFoundError.withQuiet(quiet, '');
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
        const type = await ctx.locals.discord.getChannelType(channelId)
            ?? new notFound(channelStr).throw();
        return isVoice(type);
    }
});
export const channelIsNsfwReplacer = defineReplacer<Locals.GuildChannelNsfwLocals>(['channelIsNsfw', 'isNsfw'], {
    parameters: ['channel?', 'quiet?'],
    returns: 'boolean',
    execute: async function channelIsNsfw(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
        const notFound = ChannelNotFoundError.withQuiet(quiet, '');
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
        return await ctx.locals.discord.isChannelNsfw(channelId);
    }
});
export const channelNameReplacer = defineReplacer<Locals.GuildChannelNameLocals>(['channelName', 'categoryName'], {
    parameters: ['channel?', 'quiet?'],
    returns: 'string',
    execute: async function channelName(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
        const notFound = ChannelNotFoundError.withQuiet(quiet, '');
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
        return await ctx.locals.discord.getChannelName(channelId)
            ?? new notFound(channelStr).throw();
    }
});
export const channelPositionReplacer = defineReplacer<Locals.GuildChannelPositionLocals>(['channelPosition', 'categoryPosition', 'channelPos', 'categoryPos'], {
    parameters: ['channel?', 'quiet?'],
    returns: 'number',
    execute: async function channelPosition(ctx, [{ value: channelStr }, { value: quietStr }]) {
        const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
        const notFound = ChannelNotFoundError.withQuiet(quiet, '');
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
        const type = await ctx.locals.discord.getChannelType(channelId)
            ?? new notFound(channelStr).throw();
        if (isThread(type))
            throw new BBTagRuntimeError('Threads dont have a position', `${channelStr} is a thread and doesnt have a position`);
        return await ctx.locals.discord.getChannelPosition(channelId)
            ?? new notFound(channelStr).throw();
    }
});
export const channelsReplacer = defineReplacer<Locals.GuildChannelListLocals>('channels', {
    parameters: ['channel?', 'quiet?'],
    returns: 'id[]',
    execute: async function channels(ctx, [{ value: channelStr, exists: filtered }, { value: quietStr }]) {
        if (filtered) {
            const quiet = ctx.locals.quiet || isQuiet(ctx, quietStr);
            const notFound = ChannelNotFoundError.withQuiet(quiet, '');
            const channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet, throw: notFound });
            return await ctx.locals.discord.listChannels(channelId);
        }

        return await ctx.locals.discord.listChannels();
    }
});
const channelPermissions = new DiscordPermissions('ADMINISTRATOR', 'MANAGE_CHANNELS');
export const channelCreateReplacer = defineReplacer<Locals.GuildChannelCreateLocals>('channelCreate', {
    parameters: ['name', 'type?:text', 'options?:{}'],
    returns: 'id',
    execute: async function channelCreate(ctx, [{ value: name }, { value: typeStr }, { value: optionsJson }]) {
        const authorizerPerms = await ctx.locals.discord.getPermissions(ctx.locals.discord.authorizerId);
        if (!authorizerPerms.hasAny(channelPermissions))
            throw new BBTagRuntimeError('Author cannot create channels');
        const botPerms = await ctx.locals.discord.getPermissions(ctx.locals.discord.botId);
        if (!botPerms.hasAny(channelPermissions))
            throw new FailedToCreateChannelNoPermsError();
        const options = channelCreateOptionsSchema.safeParse(optionsJson);
        if (!options.success)
            throw new BBTagRuntimeError('Invalid JSON');

        const { data: type = ChannelType.GUILD_TEXT } = channelType.safeParse(typeStr);
        if (Array.isArray(options.data.permissionOverwrites)) {
            if (!authorizerPerms.has('ADMINISTRATOR')) {
                for (const permission of options.data.permissionOverwrites)
                    if (!authorizerPerms.has(permission.allow | permission.deny))
                        throw new BBTagRuntimeError('Author missing requested permissions');
            }
            if (!botPerms.has('ADMINISTRATOR')) {
                for (const permission of options.data.permissionOverwrites)
                    if (!botPerms.has(permission.allow | permission.deny))
                        throw new FailedToCreateChannelNoPermsError();
            }
        }
        return await ctx.locals.discord.createChannel({
            ...options.data,
            name,
            type
        }) ?? new FailedToCreateChannelNoPermsError().throw();
    }
});
export const channelDeleteReplacer = defineReplacer<Locals.GuildChannelDeleteLocals>('channelDelete', {
    parameters: ['id'],
    returns: 'nothing',
    execute: async function channelDelete(ctx, [{ value: channelStr }]) {
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { throw: LegacyChannelNotFoundError });
        if (!await hasAnyPermissionsIn(ctx, ctx.locals.discord.authorizerId, channelId, channelPermissions))
            throw new BBTagRuntimeError('Author cannot edit this channel');
        if (!await hasAnyPermissionsIn(ctx, ctx.locals.discord.botId, channelId, channelPermissions))
            throw new FailedToEditChannelNoPermsError();

        if (!await ctx.locals.discord.deleteChannel(channelId))
            throw new FailedToEditChannelNoPermsError();
    }
});
export const channelEditReplacer = defineReplacer<Locals.GuildChannelEditLocals>('channelEdit', {
    parameters: ['channel', 'options?:{}'],
    returns: 'id',
    execute: async function channelEdit(ctx, [{ value: channelStr }, { value: optionsJson }]) {
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { throw: LegacyChannelNotFoundError });
        if (!await hasAnyPermissionsIn(ctx, ctx.locals.discord.authorizerId, channelId, channelPermissions))
            throw new BBTagRuntimeError('Author cannot edit this channel');
        if (!await hasAnyPermissionsIn(ctx, ctx.locals.discord.botId, channelId, channelPermissions))
            throw new FailedToEditChannelNoPermsError();
        const type = await ctx.locals.discord.getChannelType(channelId)
            ?? new LegacyChannelNotFoundError(channelStr).throw();
        const options = isThread(type)
            ? threadEditOptionsSchema.safeParse(optionsJson)
            : channelEditOptionsSchema.safeParse(optionsJson);
        if (!options.success)
            throw new BBTagRuntimeError('Invalid JSON');
        if (!await ctx.locals.discord.editChannel(channelId, options.data))
            throw new FailedToEditChannelNoPermsError();
        return channelId;
    }
});
export const channelSetPermissionsReplacer = defineReplacer<Locals.GuildChannelSetPermissionLocals>(['channelSetPermissions', 'channelSetPerms'], {
    parameters: ['channel', 'type', 'entityId', 'allow?:0', 'deny?:0'],
    returns: 'id',
    execute: async function channelSetPermissions(ctx, [{ value: channelStr }, { value: kindStr }, { value: entityStr }, { value: allowStr }, { value: denyStr }]) {
        const allow = parse.bigint(allowStr) ?? 0n;
        const deny = parse.bigint(denyStr) ?? 0n;
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { throw: LegacyChannelNotFoundError });
        const channelType = await ctx.locals.discord.getChannelType(channelId)
            ?? new LegacyChannelNotFoundError(channelStr).throw();
        if (isThread(channelType))
            throw new BBTagRuntimeError('Cannot set permissions for a thread channel');
        const kind = permissionOverwriteType.safeParse(kindStr);
        if (!kind.success)
            throw new BBTagRuntimeError('Type must be member or role');
        const authorizerPermissions = await ctx.locals.discord.getPermissions(ctx.locals.discord.authorizerId, channelId);
        if (!authorizerPermissions.has('ADMINISTRATOR')) {
            if (!authorizerPermissions.has('MANAGE_CHANNELS'))
                throw new BBTagRuntimeError('Author cannot edit this channel');
            if (!authorizerPermissions.has(allow | deny))
                throw new BBTagRuntimeError('Author missing requested permissions');
        }
        const botPermissions = await ctx.locals.discord.getPermissions(ctx.locals.discord.botId, channelId);
        if (!botPermissions.has('ADMINISTRATOR')) {
            if (!botPermissions.has('MANAGE_CHANNELS') || !botPermissions.has(allow | deny))
                throw new FailedToEditChannelNoPermsError();
        }

        const entityId = parse.bigint(entityStr) ?? new FailedToEditChannelNoPermsError().throw();
        if (!await ctx.locals.discord.setChannelPermission(channelId, entityId, kind.data, allow, deny))
            throw new FailedToEditChannelNoPermsError();

        return channelId;
    }
});
export const channelSetPositionReplacer = defineReplacer<Locals.GuildChannelSetPositionLocals>(['channelSetPosition', 'channelSetPos'], {
    parameters: ['channel', 'position'],
    returns: 'nothing',
    execute: async function channelSetPosition(ctx, [{ value: channelStr }, { value: positionStr }]) {
        const channelId = await ctx.locals.discord.queryChannel(channelStr, { throw: LegacyChannelNotFoundError });
        const authorizerPermissions = await ctx.locals.discord.getPermissions(ctx.locals.discord.authorizerId, channelId);
        if (!authorizerPermissions.hasAny(channelPermissions))
            throw new BBTagRuntimeError('Author cannot move this channel');
        const botPermissions = await ctx.locals.discord.getPermissions(ctx.locals.discord.botId, channelId);
        if (!botPermissions.hasAny(channelPermissions))
            throw new FailedToMoveChannelNoPermsError();
        const pos = parse.int(positionStr, { throw: NotANumberError });
        if (!await ctx.locals.discord.setChannelPosition(channelId, pos))
            throw new FailedToMoveChannelNoPermsError();
    }
});
export const slowModeReplacer = defineReplacer<Locals.GuildChannelSetRateLimitLocals>('slowMode', {
    parameters: ['channel?', 'time?:0'],
    returns: 'nothing',
    execute: async function slowMode(ctx, [{ value: channelStr }, { value: timeStr, exists: hasTime }]) {
        let channelId;
        let time;
        if (hasTime) {
            channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet: true, throw: LegacyChannelNotFoundError });
            time = parse.int(timeStr, { fallback: 0 });
        } else {
            channelId = await ctx.locals.discord.queryChannel(channelStr, { quiet: true });
            time = 0;
            if (channelId === null) {
                channelId = await ctx.locals.discord.queryChannel('', { quiet: true, throw: LegacyChannelNotFoundError });
                time = parse.int(channelStr, { fallback: 0 });
            }
        }
        time = Math.min(time, 21600);

        const botPermissions = await ctx.locals.discord.getPermissions(ctx.locals.discord.botId, channelId);
        if (!botPermissions.hasAny(channelPermissions))
            throw new BBTagRuntimeError('Missing required permissions');
        if (!await ctx.locals.discord.setChannelRateLimit(channelId, time))
            throw new BBTagRuntimeError('Missing required permissions');
    }
});

const autoArchiveDurationAliases = {
    ...AutoArchiveDuration,
    '3_DAYS': AutoArchiveDuration.DAY_3
};
const autoArchiveDurationish = enumish(autoArchiveDurationAliases);
const autoArchiveDuration = z.compile(z.union([
    z.union([
        integerish,
        z.unknown()
    ]).pipe(autoArchiveDurationish),
    autoArchiveDurationish
]));

const reasonSchema = z.string().transform(v => v === '' ? undefined : v);
const channelTypeAliases = {
    ...ChannelType,
    TEXT: ChannelType.GUILD_TEXT,
    VOICE: ChannelType.GUILD_VOICE,
    CATEGORY: ChannelType.GUILD_CATEGORY,
    NEWS: ChannelType.GUILD_ANNOUNCEMENT,
    ANNOUNCEMENT: ChannelType.GUILD_ANNOUNCEMENT,
    STAGE_VOICE: ChannelType.GUILD_STAGE_VOICE,
    DIRECTORY: ChannelType.GUILD_DIRECTORY,
    FORUM: ChannelType.GUILD_FORUM,
    MEDIA: ChannelType.GUILD_MEDIA
};
const channelType = z.compile(enumish(channelTypeAliases));
const videoQualityMode = enumish(VideoQualityMode);
const forumSortOrder = enumish(ForumSortOrder);
const forumLayout = enumish(ForumLayoutType);
const permissionOverwriteType = enumish(PermissionOverwriteType);

const permissionOverwriteSchema = z.object({
    allow: bigintish.nullish().transform(v => v ?? 0n),
    deny: bigintish.nullish().transform(v => v ?? 0n),
    id: bigintish,
    type: permissionOverwriteType
});

const threadEditOptionsSchema = z.compile(jsonSchema(
    z.object({
        name: z.string().nullish(),
        archived: booleanish.nullish(),
        autoArchiveDuration: autoArchiveDuration.nullish(),
        locked: booleanish.nullish(),
        invitable: booleanish.nullish(),
        rateLimitPerUser: integerish.nullish(),
        flags: integerish.nullish(),
        appliedTags: bigintish.array().nullish(),
        reason: reasonSchema.optional()
    })
));

const channelEditOptionsSchema = z.compile(jsonSchema(
    z.object({
        name: z.string().nullish(),
        type: channelType.nullish(),
        position: integerish.nullish(),
        topic: z.string().nullish(),
        nsfw: booleanish.nullish(),
        rateLimitPerUser: integerish.nullish(),
        bitrate: integerish.nullish(),
        userLimit: integerish.nullish(),
        parentID: bigintish.nullish(),
        rtcRegion: z.string().nullish(),
        videoQualityMode: videoQualityMode.nullish(),
        defaultAutoArchiveDuration: autoArchiveDuration.nullish(),
        flags: integerish.nullish(),
        availableTags: z.object({
            name: z.string(),
            moderated: booleanish,
            emojiID: bigintish.nullable().optional(),
            emojiName: z.string().nullable().optional()
        }).array().nullish(),
        defaultReactionEmoji: z.union([
            z.object({
                emojiID: bigintish.nullable(),
                emojiName: z.never().optional()
            }),
            z.object({
                emojiName: z.string().nullable(),
                emojiID: z.never().optional()
            })
        ]).nullish(),
        defaultThreadRateLimitPerUser: integerish.nullish(),
        defaultSortOrder: forumSortOrder.nullish(),
        defaultForumLayout: forumLayout.nullish(),
        reason: reasonSchema.optional()
    })
));

const channelCreateOptionsSchema = z.compile(jsonSchema(
    z.object({
        topic: z.string().optional(),
        bitrate: integerish.optional(),
        userLimit: integerish.optional(),
        rateLimitPerUser: integerish.optional(),
        position: integerish.optional(),
        permissionOverwrites: permissionOverwriteSchema.array().optional(),
        parentID: bigintish.optional(),
        nsfw: booleanish.optional(),
        rtcRegion: z.string().optional(),
        videoQualityMode: videoQualityMode.optional(),
        defaultAutoArchiveDuration: autoArchiveDuration.optional(),
        defaultReactionEmoji: z.union([
            z.object({
                emojiID: bigintish,
                emojiName: z.never().optional()
            }),
            z.object({
                emojiName: z.string(),
                emojiID: z.never().optional()
            })
        ]).optional(),
        availableTags: z.object({
            name: z.string(),
            moderated: booleanish,
            emojiID: bigintish.optional(),
            emojiName: z.string().optional()
        }).array().optional(),
        defaultSortOrder: forumSortOrder.optional(),
        flags: integerish.optional(),
        defaultThreadRateLimitPerUser: integerish.optional(),
        defaultForumLayout: forumLayout.optional(),
        reason: reasonSchema.optional()
    })
));

function isVoice(type: number): boolean {
    switch (type) {
        case ChannelType.GUILD_VOICE:
        case ChannelType.GUILD_STAGE_VOICE:
            return true;
        default:
            return false;
    }
}

function isThread(type: number): boolean {
    switch (type) {
        case ChannelType.PRIVATE_THREAD:
        case ChannelType.PUBLIC_THREAD:
        case ChannelType.ANNOUNCEMENT_THREAD:
            return true;
        default:
            return false;
    }
}

function isText(type: number): boolean {
    switch (type) {
        case ChannelType.DM:
        case ChannelType.GROUP_DM:
        case ChannelType.GUILD_ANNOUNCEMENT:
        case ChannelType.ANNOUNCEMENT_THREAD:
        case ChannelType.PRIVATE_THREAD:
        case ChannelType.PUBLIC_THREAD:
        case ChannelType.GUILD_TEXT:
        case ChannelType.GUILD_VOICE:
        case ChannelType.GUILD_STAGE_VOICE:
            return true;
        default:
            return false;
    }
}

function isCategory(type: number): boolean {
    switch (type) {
        case ChannelType.GUILD_CATEGORY:
            return true;
        default:
            return false;
    }
}

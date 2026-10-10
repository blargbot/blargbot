import type { GuildChannelCreateLocals } from '@blargbot/bbtag-engine';
import { AutoArchiveDuration, BBTagRuntimeError, ChannelType, DiscordPermissions, FailedToCreateChannelNoPermsError, ForumLayoutType, ForumSortOrder, PermissionOverwriteType, replacers, VideoQualityMode } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import type { SubtagTestContext } from '../../SubtagTestSuite.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

const channelId = 28376128632132n;

const sendMessages = DiscordPermissions.SEND_MESSAGES;
const viewChannel = DiscordPermissions.VIEW_CHANNEL;
const embedLinks = DiscordPermissions.EMBED_LINKS;

const sufficientPermissions = getSufficientPermissions();
const insufficientPermissions = getInsufficientPermissions();
const twoOverwriteCode = getTwoOverwriteCode();

await runSubtagTests<GuildChannelCreateLocals>({
    replacer: replacers.channelCreateReplacer,
    names: ['channelCreate'],
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            title: 'Create text channel',
            code: '{channelcreate;My new channel}',
            expected: channelId.toString(),
            setup(ctx) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT
                }))).resolves(channelId).mustHappen(1);
            }
        },
        ...[
            { type: 'text', channelType: ChannelType.GUILD_TEXT },
            { type: 'voice', channelType: ChannelType.GUILD_VOICE },
            { type: 'category', channelType: ChannelType.GUILD_CATEGORY },
            { type: 'news', channelType: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'this is some garbage', channelType: ChannelType.GUILD_TEXT },
            { type: '', channelType: ChannelType.GUILD_TEXT },

            // Aliases (uppercase)
            { type: 'TEXT', channelType: ChannelType.GUILD_TEXT },
            { type: 'VOICE', channelType: ChannelType.GUILD_VOICE },
            { type: 'CATEGORY', channelType: ChannelType.GUILD_CATEGORY },
            { type: 'NEWS', channelType: ChannelType.GUILD_ANNOUNCEMENT },

            // Aliases (lowercase and uppercase)
            { type: 'announcement', channelType: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'ANNOUNCEMENT', channelType: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'stage_voice', channelType: ChannelType.GUILD_STAGE_VOICE },
            { type: 'STAGE_VOICE', channelType: ChannelType.GUILD_STAGE_VOICE },
            { type: 'directory', channelType: ChannelType.GUILD_DIRECTORY },
            { type: 'DIRECTORY', channelType: ChannelType.GUILD_DIRECTORY },
            { type: 'forum', channelType: ChannelType.GUILD_FORUM },
            { type: 'FORUM', channelType: ChannelType.GUILD_FORUM },
            { type: 'media', channelType: ChannelType.GUILD_MEDIA },
            { type: 'MEDIA', channelType: ChannelType.GUILD_MEDIA },

            // GUILD_TEXT
            { type: 'guild_text', channelType: ChannelType.GUILD_TEXT },
            { type: 'GUILD_TEXT', channelType: ChannelType.GUILD_TEXT },
            { type: '0', channelType: ChannelType.GUILD_TEXT },

            // DM
            { type: 'dm', channelType: ChannelType.DM },
            { type: 'DM', channelType: ChannelType.DM },
            { type: '1', channelType: ChannelType.DM },

            // GUILD_VOICE
            { type: 'guild_voice', channelType: ChannelType.GUILD_VOICE },
            { type: 'GUILD_VOICE', channelType: ChannelType.GUILD_VOICE },
            { type: '2', channelType: ChannelType.GUILD_VOICE },

            // GROUP_DM
            { type: 'group_dm', channelType: ChannelType.GROUP_DM },
            { type: 'GROUP_DM', channelType: ChannelType.GROUP_DM },
            { type: '3', channelType: ChannelType.GROUP_DM },

            // GUILD_CATEGORY
            { type: 'guild_category', channelType: ChannelType.GUILD_CATEGORY },
            { type: 'GUILD_CATEGORY', channelType: ChannelType.GUILD_CATEGORY },
            { type: '4', channelType: ChannelType.GUILD_CATEGORY },

            // GUILD_ANNOUNCEMENT
            { type: 'guild_announcement', channelType: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'GUILD_ANNOUNCEMENT', channelType: ChannelType.GUILD_ANNOUNCEMENT },
            { type: '5', channelType: ChannelType.GUILD_ANNOUNCEMENT },

            // ANNOUNCEMENT_THREAD
            { type: 'announcement_thread', channelType: ChannelType.ANNOUNCEMENT_THREAD },
            { type: 'ANNOUNCEMENT_THREAD', channelType: ChannelType.ANNOUNCEMENT_THREAD },
            { type: '10', channelType: ChannelType.ANNOUNCEMENT_THREAD },

            // PUBLIC_THREAD
            { type: 'public_thread', channelType: ChannelType.PUBLIC_THREAD },
            { type: 'PUBLIC_THREAD', channelType: ChannelType.PUBLIC_THREAD },
            { type: '11', channelType: ChannelType.PUBLIC_THREAD },

            // PRIVATE_THREAD
            { type: 'private_thread', channelType: ChannelType.PRIVATE_THREAD },
            { type: 'PRIVATE_THREAD', channelType: ChannelType.PRIVATE_THREAD },
            { type: '12', channelType: ChannelType.PRIVATE_THREAD },

            // GUILD_STAGE_VOICE
            { type: 'guild_stage_voice', channelType: ChannelType.GUILD_STAGE_VOICE },
            { type: 'GUILD_STAGE_VOICE', channelType: ChannelType.GUILD_STAGE_VOICE },
            { type: 'guild_stage-voice', channelType: ChannelType.GUILD_STAGE_VOICE },
            { type: 'GUILD_STAGE-VOICE', channelType: ChannelType.GUILD_STAGE_VOICE },
            { type: '13', channelType: ChannelType.GUILD_STAGE_VOICE },

            // GUILD_DIRECTORY
            { type: 'guild_directory', channelType: ChannelType.GUILD_DIRECTORY },
            { type: 'GUILD_DIRECTORY', channelType: ChannelType.GUILD_DIRECTORY },
            { type: '14', channelType: ChannelType.GUILD_DIRECTORY },

            // GUILD_FORUM
            { type: 'guild_forum', channelType: ChannelType.GUILD_FORUM },
            { type: 'GUILD_FORUM', channelType: ChannelType.GUILD_FORUM },
            { type: '15', channelType: ChannelType.GUILD_FORUM },

            // GUILD_MEDIA
            { type: 'guild_media', channelType: ChannelType.GUILD_MEDIA },
            { type: 'GUILD_MEDIA', channelType: ChannelType.GUILD_MEDIA },
            { type: '16', channelType: ChannelType.GUILD_MEDIA },

            // Hyphens are treated as underscores
            { type: 'stage-voice', channelType: ChannelType.GUILD_STAGE_VOICE },
            { type: 'guild-text', channelType: ChannelType.GUILD_TEXT },
            { type: 'group-dm', channelType: ChannelType.GROUP_DM },
            { type: 'guild-voice', channelType: ChannelType.GUILD_VOICE },
            { type: 'guild-category', channelType: ChannelType.GUILD_CATEGORY },
            { type: 'guild-announcement', channelType: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'announcement-thread', channelType: ChannelType.ANNOUNCEMENT_THREAD },
            { type: 'public-thread', channelType: ChannelType.PUBLIC_THREAD },
            { type: 'private-thread', channelType: ChannelType.PRIVATE_THREAD },
            { type: 'guild-stage-voice', channelType: ChannelType.GUILD_STAGE_VOICE },
            { type: 'guild-directory', channelType: ChannelType.GUILD_DIRECTORY },
            { type: 'guild-forum', channelType: ChannelType.GUILD_FORUM },
            { type: 'guild-media', channelType: ChannelType.GUILD_MEDIA },

            // Unknown numbers fall back to a text channel
            { type: '99', channelType: ChannelType.GUILD_TEXT },
            { type: '-1', channelType: ChannelType.GUILD_TEXT }
        ].map(({ type, channelType }) => ({
            title: `Create channel with type "${type}"`,
            code: `{channelcreate;My new channel;${type}}`,
            expected: channelId.toString(),
            setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: channelType
                }))).resolves(channelId).mustHappen(1);
            }
        })),
        ...[
            { type: 'text', channelType: ChannelType.GUILD_TEXT },
            { type: 'voice', channelType: ChannelType.GUILD_VOICE },
            { type: 'category', channelType: ChannelType.GUILD_CATEGORY },
            { type: 'news', channelType: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'this is some garbage', channelType: ChannelType.GUILD_TEXT },
            { type: '', channelType: ChannelType.GUILD_TEXT }
        ].map(({ type, channelType }) => ({
            title: `Create channel with empty options and type "${type}"`,
            code: `{channelcreate;My new channel;${type};{escapebbtag;{}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: channelType
                }))).resolves(channelId).mustHappen(1);
            }
        })),
        ...[
            { type: 'text', channelType: ChannelType.GUILD_TEXT },
            { type: 'voice', channelType: ChannelType.GUILD_VOICE },
            { type: 'category', channelType: ChannelType.GUILD_CATEGORY },
            { type: 'news', channelType: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'this is some garbage', channelType: ChannelType.GUILD_TEXT },
            { type: '', channelType: ChannelType.GUILD_TEXT }
        ].map(({ type, channelType }) => ({
            title: `Create channel with complex options and type "${type}"`,
            code: `{channelcreate;My new channel;${type};{escapebbtag;${JSON.stringify({
                bitrate: 1234,
                nsfw: true,
                parentID: '23987233279389273',
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        allow: '3827468274',
                        deny: '42937843478',
                        type: 0
                    },
                    {
                        id: '9054786496875634',
                        allow: '23432424',
                        deny: '432434234',
                        type: 1
                    }
                ],
                rateLimitPerUser: 231432,
                topic: 'xyz123',
                reason: 'abcdef',
                userLimit: 32042430
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: channelType,
                    bitrate: 1234,
                    nsfw: true,
                    parentID: 23987233279389273n,
                    permissionOverwrites: [
                        {
                            id: 329478923748223n,
                            allow: 3827468274n,
                            deny: 42937843478n,
                            type: 0
                        },
                        {
                            id: 9054786496875634n,
                            allow: 23432424n,
                            deny: 432434234n,
                            type: 1
                        }
                    ],
                    rateLimitPerUser: 231432,
                    topic: 'xyz123',
                    reason: 'abcdef',
                    userLimit: 32042430
                }))).resolves(channelId).mustHappen(1);
            }
        })),
        {
            title: 'String options are parsed',
            code: `{channelcreate;My new channel;text;{escapebbtag;${JSON.stringify({
                bitrate: '1234',
                nsfw: 'true',
                parentID: '23987233279389273',
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        allow: '3827468274',
                        deny: '42937843478',
                        type: 0
                    },
                    {
                        id: '9054786496875634',
                        allow: '23432424',
                        deny: '432434234',
                        type: 1
                    }
                ],
                rateLimitPerUser: '231432',
                topic: 'xyz123',
                reason: 'abcdef',
                userLimit: '32042430'
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT,
                    bitrate: 1234,
                    nsfw: true,
                    parentID: 23987233279389273n,
                    permissionOverwrites: [
                        {
                            id: 329478923748223n,
                            allow: 3827468274n,
                            deny: 42937843478n,
                            type: 0
                        },
                        {
                            id: 9054786496875634n,
                            allow: 23432424n,
                            deny: 432434234n,
                            type: 1
                        }
                    ],
                    rateLimitPerUser: 231432,
                    topic: 'xyz123',
                    reason: 'abcdef',
                    userLimit: 32042430
                }))).resolves(channelId).mustHappen(1);
            }
        },
        {
            title: 'Permission overwrite defaults',
            code: `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        type: 0
                    }
                ]
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT,
                    permissionOverwrites: [
                        {
                            id: 329478923748223n,
                            allow: 0n,
                            deny: 0n,
                            type: 0
                        }
                    ]
                }))).resolves(channelId).mustHappen(1);
            }
        },

        // Enum options: lowercase name, uppercase name, number and numeric string for every value
        ...[
            { type: 'role', value: PermissionOverwriteType.ROLE },
            { type: 'ROLE', value: PermissionOverwriteType.ROLE },
            { type: 0, value: PermissionOverwriteType.ROLE },
            { type: '0', value: PermissionOverwriteType.ROLE },
            { type: 'member', value: PermissionOverwriteType.MEMBER },
            { type: 'MEMBER', value: PermissionOverwriteType.MEMBER },
            { type: 1, value: PermissionOverwriteType.MEMBER },
            { type: '1', value: PermissionOverwriteType.MEMBER }
        ].map(({ type, value }) => ({
            title: `Create channel with permission overwrite type ${JSON.stringify(type)}`,
            code: `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        type
                    }
                ]
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT,
                    permissionOverwrites: [
                        {
                            id: 329478923748223n,
                            allow: 0n,
                            deny: 0n,
                            type: value
                        }
                    ]
                }))).resolves(channelId).mustHappen(1);
            }
        })),
        ...[
            { videoQualityMode: 'auto', value: VideoQualityMode.AUTO },
            { videoQualityMode: 'AUTO', value: VideoQualityMode.AUTO },
            { videoQualityMode: 1, value: VideoQualityMode.AUTO },
            { videoQualityMode: '1', value: VideoQualityMode.AUTO },
            { videoQualityMode: 'full', value: VideoQualityMode.FULL },
            { videoQualityMode: 'FULL', value: VideoQualityMode.FULL },
            { videoQualityMode: 2, value: VideoQualityMode.FULL },
            { videoQualityMode: '2', value: VideoQualityMode.FULL }
        ].map(({ videoQualityMode, value }) => ({
            title: `Create channel with video quality mode ${JSON.stringify(videoQualityMode)}`,
            code: `{channelcreate;My new channel;voice;{escapebbtag;${JSON.stringify({ videoQualityMode })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_VOICE,
                    videoQualityMode: value
                }))).resolves(channelId).mustHappen(1);
            }
        })),
        ...[
            { defaultAutoArchiveDuration: 'hour', value: AutoArchiveDuration.HOUR },
            { defaultAutoArchiveDuration: 'HOUR', value: AutoArchiveDuration.HOUR },
            { defaultAutoArchiveDuration: 60, value: AutoArchiveDuration.HOUR },
            { defaultAutoArchiveDuration: '60', value: AutoArchiveDuration.HOUR },
            { defaultAutoArchiveDuration: 'day', value: AutoArchiveDuration.DAY },
            { defaultAutoArchiveDuration: 'DAY', value: AutoArchiveDuration.DAY },
            { defaultAutoArchiveDuration: 1440, value: AutoArchiveDuration.DAY },
            { defaultAutoArchiveDuration: '1440', value: AutoArchiveDuration.DAY },
            { defaultAutoArchiveDuration: 'day_3', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: 'DAY_3', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: 'day-3', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: 'DAY-3', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: '3days', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: '3DAYS', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: '3-days', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: '3-DAYS', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: '3_days', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: '3_DAYS', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: 4320, value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: '4320', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: 'week', value: AutoArchiveDuration.WEEK },
            { defaultAutoArchiveDuration: 'WEEK', value: AutoArchiveDuration.WEEK },
            { defaultAutoArchiveDuration: 10080, value: AutoArchiveDuration.WEEK },
            { defaultAutoArchiveDuration: '10080', value: AutoArchiveDuration.WEEK }
        ].map(({ defaultAutoArchiveDuration, value }) => ({
            title: `Create channel with default auto archive duration ${JSON.stringify(defaultAutoArchiveDuration)}`,
            code: `{channelcreate;My new channel;forum;{escapebbtag;${JSON.stringify({ defaultAutoArchiveDuration })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_FORUM,
                    defaultAutoArchiveDuration: value
                }))).resolves(channelId).mustHappen(1);
            }
        })),
        ...[
            { defaultSortOrder: 'latest_activity', value: ForumSortOrder.LATEST_ACTIVITY },
            { defaultSortOrder: 'LATEST_ACTIVITY', value: ForumSortOrder.LATEST_ACTIVITY },
            { defaultSortOrder: 'latest-activity', value: ForumSortOrder.LATEST_ACTIVITY },
            { defaultSortOrder: 'LATEST-ACTIVITY', value: ForumSortOrder.LATEST_ACTIVITY },
            { defaultSortOrder: 0, value: ForumSortOrder.LATEST_ACTIVITY },
            { defaultSortOrder: '0', value: ForumSortOrder.LATEST_ACTIVITY },
            { defaultSortOrder: 'creation_date', value: ForumSortOrder.CREATION_DATE },
            { defaultSortOrder: 'CREATION_DATE', value: ForumSortOrder.CREATION_DATE },
            { defaultSortOrder: 'creation-date', value: ForumSortOrder.CREATION_DATE },
            { defaultSortOrder: 'CREATION-DATE', value: ForumSortOrder.CREATION_DATE },
            { defaultSortOrder: 1, value: ForumSortOrder.CREATION_DATE },
            { defaultSortOrder: '1', value: ForumSortOrder.CREATION_DATE }
        ].map(({ defaultSortOrder, value }) => ({
            title: `Create channel with default sort order ${JSON.stringify(defaultSortOrder)}`,
            code: `{channelcreate;My new channel;forum;{escapebbtag;${JSON.stringify({ defaultSortOrder })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_FORUM,
                    defaultSortOrder: value
                }))).resolves(channelId).mustHappen(1);
            }
        })),
        ...[
            { defaultForumLayout: 'not_set', value: ForumLayoutType.NOT_SET },
            { defaultForumLayout: 'NOT_SET', value: ForumLayoutType.NOT_SET },
            { defaultForumLayout: 'not-set', value: ForumLayoutType.NOT_SET },
            { defaultForumLayout: 'NOT-SET', value: ForumLayoutType.NOT_SET },
            { defaultForumLayout: 0, value: ForumLayoutType.NOT_SET },
            { defaultForumLayout: '0', value: ForumLayoutType.NOT_SET },
            { defaultForumLayout: 'list_view', value: ForumLayoutType.LIST_VIEW },
            { defaultForumLayout: 'LIST_VIEW', value: ForumLayoutType.LIST_VIEW },
            { defaultForumLayout: 'list-view', value: ForumLayoutType.LIST_VIEW },
            { defaultForumLayout: 'LIST-VIEW', value: ForumLayoutType.LIST_VIEW },
            { defaultForumLayout: 1, value: ForumLayoutType.LIST_VIEW },
            { defaultForumLayout: '1', value: ForumLayoutType.LIST_VIEW },
            { defaultForumLayout: 'gallery_view', value: ForumLayoutType.GALLERY_VIEW },
            { defaultForumLayout: 'GALLERY_VIEW', value: ForumLayoutType.GALLERY_VIEW },
            { defaultForumLayout: 'gallery-view', value: ForumLayoutType.GALLERY_VIEW },
            { defaultForumLayout: 'GALLERY-VIEW', value: ForumLayoutType.GALLERY_VIEW },
            { defaultForumLayout: 2, value: ForumLayoutType.GALLERY_VIEW },
            { defaultForumLayout: '2', value: ForumLayoutType.GALLERY_VIEW }
        ].map(({ defaultForumLayout, value }) => ({
            title: `Create channel with default forum layout ${JSON.stringify(defaultForumLayout)}`,
            code: `{channelcreate;My new channel;forum;{escapebbtag;${JSON.stringify({ defaultForumLayout })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_FORUM,
                    defaultForumLayout: value
                }))).resolves(channelId).mustHappen(1);
            }
        })),
        ...[
            { title: 'Invalid permission overwrite type name', options: { permissionOverwrites: [{ id: '329478923748223', type: 'garbage' }] } },
            { title: 'Invalid permission overwrite type number', options: { permissionOverwrites: [{ id: '329478923748223', type: 99 }] } },
            { title: 'Invalid permission overwrite type numeric string', options: { permissionOverwrites: [{ id: '329478923748223', type: '99' }] } },
            { title: 'Invalid video quality mode name', options: { videoQualityMode: 'garbage' } },
            { title: 'Invalid video quality mode number', options: { videoQualityMode: 99 } },
            { title: 'Invalid video quality mode zero', options: { videoQualityMode: 0 } },
            { title: 'Invalid default auto archive duration name', options: { defaultAutoArchiveDuration: 'garbage' } },
            { title: 'Invalid default auto archive duration number', options: { defaultAutoArchiveDuration: 99 } },
            { title: 'Invalid default auto archive duration numeric string', options: { defaultAutoArchiveDuration: '99' } },
            { title: 'Invalid default sort order name', options: { defaultSortOrder: 'garbage' } },
            { title: 'Invalid default sort order number', options: { defaultSortOrder: 99 } },
            { title: 'Invalid default forum layout name', options: { defaultForumLayout: 'garbage' } },
            { title: 'Invalid default forum layout number', options: { defaultForumLayout: 99 } }
        ].map(({ title, options }) => {
            const code = `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify(options)}}}`;
            return {
                title,
                code,
                expected: '`Invalid JSON`',
                replacers: [replacers.escapeBBTagReplacer],
                errors: [
                    {
                        error: new BBTagRuntimeError('Invalid JSON')
                    }
                ],
                setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                    setupChannelPermissions(ctx);
                }
            };
        }),
        {
            title: 'Author missing requested permissions',
            code: `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        allow: '13',
                        type: 0
                    }
                ]
            })}}}`,
            expected: '`Author missing requested permissions`',
            replacers: [replacers.escapeBBTagReplacer],
            errors: [
                {
                    error: new BBTagRuntimeError('Author missing requested permissions')
                }
            ],
            setup(ctx) {
                setupChannelPermissions(ctx, new DiscordPermissions('MANAGE_CHANNELS'));
            }
        },
        {
            title: 'Author cannot create channels',
            code: '{channelcreate;My new channel!}',
            expected: '`Author cannot create channels`',
            errors: [
                {
                    error: new BBTagRuntimeError('Author cannot create channels')
                }
            ],
            setup(ctx) {
                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId))
                    .resolves(new DiscordPermissions(0n))
                    .mustHappen(1);
            }
        },
        {
            title: 'Invalid JSON',
            code: '{channelcreate;My new channel;;This isnt valid json!}',
            expected: '`Invalid JSON`',
            errors: [
                {
                    error: new BBTagRuntimeError('Invalid JSON')
                }
            ],
            setup(ctx) {
                setupChannelPermissions(ctx);
            }
        },
        {
            title: 'Bot lacks channel permissions',
            code: '{channelcreate;My new channel}',
            expected: '`Failed to create channel: no perms`',
            errors: [
                {
                    error: new FailedToCreateChannelNoPermsError()
                }
            ],
            setup(ctx) {
                setupChannelPermissions(
                    ctx,
                    new DiscordPermissions('ADMINISTRATOR'),
                    new DiscordPermissions(0n)
                );
            }
        },
        {
            title: 'Bot lacks permissions requested by overwrite',
            code: `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        allow: '13',
                        type: 0
                    }
                ]
            })}}}`,
            expected: '`Failed to create channel: no perms`',
            replacers: [replacers.escapeBBTagReplacer],
            errors: [
                {
                    error: new FailedToCreateChannelNoPermsError()
                }
            ],
            setup(ctx) {
                setupChannelPermissions(
                    ctx,
                    new DiscordPermissions('ADMINISTRATOR'),
                    new DiscordPermissions('MANAGE_CHANNELS')
                );
            }
        },

        // Permissions needed to create a channel
        {
            title: 'Author with only MANAGE_CHANNELS can create channels',
            code: '{channelcreate;My new channel}',
            expected: channelId.toString(),
            setup(ctx) {
                setupChannelPermissions(ctx, new DiscordPermissions('MANAGE_CHANNELS'));

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT
                }))).resolves(channelId).mustHappen(1);
            }
        },
        {
            title: 'Bot with only MANAGE_CHANNELS can create channels',
            code: '{channelcreate;My new channel}',
            expected: channelId.toString(),
            setup(ctx) {
                setupChannelPermissions(ctx, undefined, new DiscordPermissions('MANAGE_CHANNELS'));

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT
                }))).resolves(channelId).mustHappen(1);
            }
        },
        {
            title: 'Author with only unrelated permissions cannot create channels',
            code: '{channelcreate;My new channel}',
            expected: '`Author cannot create channels`',
            errors: [
                {
                    error: new BBTagRuntimeError('Author cannot create channels')
                }
            ],
            setup(ctx) {
                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId))
                    .resolves(new DiscordPermissions('SEND_MESSAGES', 'VIEW_CHANNEL'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Bot with only unrelated permissions cannot create channels',
            code: '{channelcreate;My new channel}',
            expected: '`Failed to create channel: no perms`',
            errors: [
                {
                    error: new FailedToCreateChannelNoPermsError()
                }
            ],
            setup(ctx) {
                setupChannelPermissions(
                    ctx,
                    undefined,
                    new DiscordPermissions('SEND_MESSAGES', 'VIEW_CHANNEL')
                );
            }
        },

        // The order that permissions are checked in
        {
            title: 'Author and bot cannot create channels',
            code: '{channelcreate;My new channel}',
            expected: '`Author cannot create channels`',
            errors: [
                {
                    error: new BBTagRuntimeError('Author cannot create channels')
                }
            ],
            setup(ctx) {
                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId))
                    .resolves(new DiscordPermissions(0n))
                    .mustHappen(1);
            }
        },
        {
            title: 'Author permissions are checked before options are parsed',
            code: '{channelcreate;My new channel;;This isnt valid json!}',
            expected: '`Author cannot create channels`',
            errors: [
                {
                    error: new BBTagRuntimeError('Author cannot create channels')
                }
            ],
            setup(ctx) {
                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId))
                    .resolves(new DiscordPermissions(0n))
                    .mustHappen(1);
            }
        },
        {
            title: 'Bot permissions are checked before options are parsed',
            code: '{channelcreate;My new channel;;This isnt valid json!}',
            expected: '`Failed to create channel: no perms`',
            errors: [
                {
                    error: new FailedToCreateChannelNoPermsError()
                }
            ],
            setup(ctx) {
                setupChannelPermissions(
                    ctx,
                    new DiscordPermissions('ADMINISTRATOR'),
                    new DiscordPermissions(0n)
                );
            }
        },

        // Permissions needed by overwrites
        ...sufficientPermissions.map(({ title, held, allow, deny }) => ({
            title: `Author ${title}`,
            code: `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        allow: allow.toString(),
                        deny: deny.toString(),
                        type: 0
                    }
                ]
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                setupChannelPermissions(ctx, held);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT,
                    permissionOverwrites: [
                        {
                            id: 329478923748223n,
                            allow: allow.raw,
                            deny: deny.raw,
                            type: 0
                        }
                    ]
                }))).resolves(channelId).mustHappen(1);
            }
        })),
        ...sufficientPermissions.map(({ title, held, allow, deny }) => ({
            title: `Bot ${title}`,
            code: `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        allow: allow.toString(),
                        deny: deny.toString(),
                        type: 0
                    }
                ]
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                setupChannelPermissions(ctx, undefined, held);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT,
                    permissionOverwrites: [
                        {
                            id: 329478923748223n,
                            allow: allow.raw,
                            deny: deny.raw,
                            type: 0
                        }
                    ]
                }))).resolves(channelId).mustHappen(1);
            }
        })),
        ...insufficientPermissions.map(({ title, held, allow, deny }) => {
            const code = `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        allow: allow.toString(),
                        deny: deny.toString(),
                        type: 0
                    }
                ]
            })}}}`;
            return {
                title: `Author ${title}`,
                code,
                expected: '`Author missing requested permissions`',
                replacers: [replacers.escapeBBTagReplacer],
                errors: [
                    {
                        error: new BBTagRuntimeError('Author missing requested permissions')
                    }
                ],
                setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                    setupChannelPermissions(ctx, held);
                }
            };
        }),
        ...insufficientPermissions.map(({ title, held, allow, deny }) => {
            const code = `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        allow: allow.toString(),
                        deny: deny.toString(),
                        type: 0
                    }
                ]
            })}}}`;
            return {
                title: `Bot ${title}`,
                code,
                expected: '`Failed to create channel: no perms`',
                replacers: [replacers.escapeBBTagReplacer],
                errors: [
                    {
                        error: new FailedToCreateChannelNoPermsError()
                    }
                ],
                setup(ctx: SubtagTestContext<GuildChannelCreateLocals>) {
                    setupChannelPermissions(ctx, undefined, held);
                }
            };
        }),
        {
            title: 'Empty permission overwrites require no extra permissions',
            code: `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: []
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                setupChannelPermissions(
                    ctx,
                    new DiscordPermissions('MANAGE_CHANNELS'),
                    new DiscordPermissions('MANAGE_CHANNELS')
                );

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT,
                    permissionOverwrites: []
                }))).resolves(channelId).mustHappen(1);
            }
        },
        {
            title: 'Author and bot hold the permissions for every overwrite',
            code: twoOverwriteCode,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                setupChannelPermissions(
                    ctx,
                    new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES', 'VIEW_CHANNEL'),
                    new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES', 'VIEW_CHANNEL')
                );

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT,
                    permissionOverwrites: [
                        {
                            id: 329478923748223n,
                            allow: sendMessages.raw,
                            deny: 0n,
                            type: 0
                        },
                        {
                            id: 9054786496875634n,
                            allow: viewChannel.raw,
                            deny: 0n,
                            type: 0
                        }
                    ]
                }))).resolves(channelId).mustHappen(1);
            }
        },
        {
            title: 'Author missing permissions for only the second overwrite',
            code: twoOverwriteCode,
            expected: '`Author missing requested permissions`',
            replacers: [replacers.escapeBBTagReplacer],
            errors: [
                {
                    error: new BBTagRuntimeError('Author missing requested permissions')
                }
            ],
            setup(ctx) {
                setupChannelPermissions(ctx, new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES'));
            }
        },
        {
            title: 'Bot missing permissions for only the second overwrite',
            code: twoOverwriteCode,
            expected: '`Failed to create channel: no perms`',
            replacers: [replacers.escapeBBTagReplacer],
            errors: [
                {
                    error: new FailedToCreateChannelNoPermsError()
                }
            ],
            setup(ctx) {
                setupChannelPermissions(ctx, undefined, new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES'));
            }
        },
        {
            // The author fails the second overwrite and the bot would fail the first
            title: 'Author overwrite permissions are checked before bot overwrite permissions',
            code: twoOverwriteCode,
            expected: '`Author missing requested permissions`',
            replacers: [replacers.escapeBBTagReplacer],
            errors: [
                {
                    error: new BBTagRuntimeError('Author missing requested permissions')
                }
            ],
            setup(ctx) {
                setupChannelPermissions(
                    ctx,
                    new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES'),
                    new DiscordPermissions('MANAGE_CHANNELS', 'VIEW_CHANNEL')
                );
            }
        },
        {
            title: 'Channel creation returns null',
            code: '{channelcreate;My new channel}',
            expected: '`Failed to create channel: no perms`',
            errors: [
                {
                    error: new FailedToCreateChannelNoPermsError()
                }
            ],
            setup(ctx) {
                setupChannelPermissions(ctx);

                ctx.discord.setup((m, $) => m.createChannel($({
                    name: 'My new channel',
                    type: ChannelType.GUILD_TEXT
                }))).resolves(null).mustHappen(1);
            }
        }
    ]
});

function setupChannelPermissions(
    ctx: SubtagTestContext<GuildChannelCreateLocals>,
    authorizerPermissions = new DiscordPermissions('ADMINISTRATOR'),
    botPermissions = new DiscordPermissions('ADMINISTRATOR')
): void {
    const authorizerId = randomSnowflake('authorizerId');
    const botId = randomSnowflake('botId');

    ctx.discord.setup(m => m.authorizerId)
        .returns(authorizerId)
        .mustHappen(1);

    ctx.discord.setup(m => m.botId)
        .returns(botId)
        .mustHappen(1);

    ctx.discord.setup(m => m.getPermissions(authorizerId))
        .resolves(authorizerPermissions)
        .mustHappen(1);

    ctx.discord.setup(m => m.getPermissions(botId))
        .resolves(botPermissions)
        .mustHappen(1);
}

// Overwrite requests the author/bot must hold every bit of (unless they are an administrator)
interface OverwritePermissionScenario {
    readonly title: string;
    readonly held: DiscordPermissions;
    readonly allow: DiscordPermissions;
    readonly deny: DiscordPermissions;
}

function getSufficientPermissions(): OverwritePermissionScenario[] {
    return [
        {
            title: 'requests no bits',
            held: new DiscordPermissions('MANAGE_CHANNELS'),
            allow: new DiscordPermissions(0n),
            deny: new DiscordPermissions(0n)
        },
        {
            title: 'holds exactly the allowed bit',
            held: new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES'),
            allow: sendMessages,
            deny: new DiscordPermissions(0n)
        },
        {
            title: 'holds exactly the denied bit',
            held: new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES'),
            allow: new DiscordPermissions(0n),
            deny: sendMessages
        },
        {
            title: 'holds exactly the allowed and denied bits',
            held: new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES', 'VIEW_CHANNEL'),
            allow: sendMessages,
            deny: viewChannel
        },
        {
            title: 'holds more than the requested bits',
            held: new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES', 'VIEW_CHANNEL', 'EMBED_LINKS'),
            allow: sendMessages,
            deny: new DiscordPermissions(0n)
        },
        {
            title: 'is an administrator requesting bits it does not explicitly hold',
            held: new DiscordPermissions('ADMINISTRATOR'),
            allow: new DiscordPermissions('SEND_MESSAGES', 'VIEW_CHANNEL'),
            deny: embedLinks
        }
    ];
}

function getInsufficientPermissions(): OverwritePermissionScenario[] {
    return [
        {
            title: 'lacks the allowed bit',
            held: new DiscordPermissions('MANAGE_CHANNELS'),
            allow: sendMessages,
            deny: new DiscordPermissions(0n)
        },
        {
            title: 'lacks the denied bit',
            held: new DiscordPermissions('MANAGE_CHANNELS'),
            allow: new DiscordPermissions(0n),
            deny: sendMessages
        },
        {
            title: 'holds only some of the allowed bits',
            held: new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES'),
            allow: new DiscordPermissions('SEND_MESSAGES', 'VIEW_CHANNEL'),
            deny: new DiscordPermissions(0n)
        },
        {
            title: 'holds the allowed bit but lacks the denied bit',
            held: new DiscordPermissions('MANAGE_CHANNELS', 'SEND_MESSAGES'),
            allow: sendMessages,
            deny: viewChannel
        },
        {
            title: 'holds the denied bit but lacks the allowed bit',
            held: new DiscordPermissions('MANAGE_CHANNELS', 'VIEW_CHANNEL'),
            allow: sendMessages,
            deny: viewChannel
        }
    ];
}

// Needs SEND_MESSAGES for the first overwrite and VIEW_CHANNEL for the second
function getTwoOverwriteCode(): string {
    return `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
        permissionOverwrites: [
            {
                id: '329478923748223',
                allow: sendMessages.toString(),
                type: 0
            },
            {
                id: '9054786496875634',
                allow: viewChannel.toString(),
                type: 0
            }
        ]
    })}}}`;
}

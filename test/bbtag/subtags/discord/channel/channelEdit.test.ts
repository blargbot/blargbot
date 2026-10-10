import type { GuildChannelEditLocals } from '@blargbot/bbtag-engine';
import { AutoArchiveDuration, BBTagRuntimeError, ChannelType, DiscordPermissions, FailedToEditChannelNoPermsError, ForumLayoutType, ForumSortOrder, LegacyChannelNotFoundError, replacers, VideoQualityMode } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import type { SubtagTestContext } from '../../SubtagTestSuite.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

const channelId = 1293671282973698n;

await runSubtagTests<GuildChannelEditLocals>({
    replacer: replacers.channelEditReplacer,
    names: ['channelEdit'],
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            title: 'Edit non-thread channel with no options',
            code: '{channeledit;1293671282973698}',
            expected: channelId.toString(),
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_TEXT);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({})))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'Edit thread with no options',
            code: '{channeledit;1293671282973698}',
            expected: channelId.toString(),
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.PUBLIC_THREAD);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({})))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'Edit non-thread channel with options',
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({
                bitrate: 123,
                name: 'new channel name',
                nsfw: true,
                parentID: '2836742834628346',
                rateLimitPerUser: 456,
                topic: 'New channel topic',
                userLimit: 789,
                defaultAutoArchiveDuration: 1440
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_TEXT);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    bitrate: 123,
                    name: 'new channel name',
                    nsfw: true,
                    parentID: 2836742834628346n,
                    rateLimitPerUser: 456,
                    topic: 'New channel topic',
                    userLimit: 789,
                    defaultAutoArchiveDuration: AutoArchiveDuration.DAY
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'Edit thread with options',
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({
                archived: true,
                autoArchiveDuration: 4320,
                locked: true,
                name: 'New thread name',
                rateLimitPerUser: 123,
                invitable: true
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.PUBLIC_THREAD);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    archived: true,
                    autoArchiveDuration: AutoArchiveDuration.DAY_3,
                    locked: true,
                    name: 'New thread name',
                    rateLimitPerUser: 123,
                    invitable: true
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'String options are parsed for non-thread channel',
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({
                bitrate: '123',
                name: 'new channel name',
                nsfw: 'true',
                parentID: '2836742834628346',
                rateLimitPerUser: '456',
                topic: 'New channel topic',
                userLimit: '789',
                defaultAutoArchiveDuration: '1440'
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_TEXT);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    bitrate: 123,
                    name: 'new channel name',
                    nsfw: true,
                    parentID: 2836742834628346n,
                    rateLimitPerUser: 456,
                    topic: 'New channel topic',
                    userLimit: 789,
                    defaultAutoArchiveDuration: AutoArchiveDuration.DAY
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            title: 'String options are parsed for thread',
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({
                archived: 'true',
                autoArchiveDuration: '4320',
                locked: 'true',
                name: 'New thread name',
                rateLimitPerUser: '123',
                invitable: 'true'
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.PUBLIC_THREAD);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    archived: true,
                    autoArchiveDuration: AutoArchiveDuration.DAY_3,
                    locked: true,
                    name: 'New thread name',
                    rateLimitPerUser: 123,
                    invitable: true
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            // Previously this was rejected with `Invalid JSON`, but the new schemas strip unknown keys
            title: 'Thread-only options are ignored for non-thread channel',
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({
                archived: true,
                autoArchiveDuration: 4320,
                locked: true,
                name: 'New thread name',
                rateLimitPerUser: 123,
                invitable: true
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_TEXT);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    name: 'New thread name',
                    rateLimitPerUser: 123
                }))).resolves(true).mustHappen(1);
            }
        },
        {
            // Previously this was rejected with `Invalid JSON`, but the new schemas strip unknown keys
            title: 'Channel-only options are ignored for thread',
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({
                bitrate: 123,
                name: 'new channel name',
                nsfw: true,
                parentID: '2836742834628346',
                rateLimitPerUser: 456,
                topic: 'New channel topic',
                userLimit: 789,
                defaultAutoArchiveDuration: 1440,
                locked: true
            })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.PUBLIC_THREAD);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    name: 'new channel name',
                    rateLimitPerUser: 456,
                    locked: true
                }))).resolves(true).mustHappen(1);
            }
        },

        // Enum options: lowercase name, UPPERCASE name, number and numeric string for every value
        ...[
            // GUILD_TEXT
            { type: 'guild_text', value: ChannelType.GUILD_TEXT },
            { type: 'GUILD_TEXT', value: ChannelType.GUILD_TEXT },
            { type: 0, value: ChannelType.GUILD_TEXT },
            { type: '0', value: ChannelType.GUILD_TEXT },

            // DM
            { type: 'dm', value: ChannelType.DM },
            { type: 'DM', value: ChannelType.DM },
            { type: 1, value: ChannelType.DM },
            { type: '1', value: ChannelType.DM },

            // GUILD_VOICE
            { type: 'guild_voice', value: ChannelType.GUILD_VOICE },
            { type: 'GUILD_VOICE', value: ChannelType.GUILD_VOICE },
            { type: 2, value: ChannelType.GUILD_VOICE },
            { type: '2', value: ChannelType.GUILD_VOICE },

            // GROUP_DM
            { type: 'group_dm', value: ChannelType.GROUP_DM },
            { type: 'GROUP_DM', value: ChannelType.GROUP_DM },
            { type: 3, value: ChannelType.GROUP_DM },
            { type: '3', value: ChannelType.GROUP_DM },

            // GUILD_CATEGORY
            { type: 'guild_category', value: ChannelType.GUILD_CATEGORY },
            { type: 'GUILD_CATEGORY', value: ChannelType.GUILD_CATEGORY },
            { type: 4, value: ChannelType.GUILD_CATEGORY },
            { type: '4', value: ChannelType.GUILD_CATEGORY },

            // GUILD_ANNOUNCEMENT
            { type: 'guild_announcement', value: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'GUILD_ANNOUNCEMENT', value: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 5, value: ChannelType.GUILD_ANNOUNCEMENT },
            { type: '5', value: ChannelType.GUILD_ANNOUNCEMENT },

            // ANNOUNCEMENT_THREAD
            { type: 'announcement_thread', value: ChannelType.ANNOUNCEMENT_THREAD },
            { type: 'ANNOUNCEMENT_THREAD', value: ChannelType.ANNOUNCEMENT_THREAD },
            { type: 10, value: ChannelType.ANNOUNCEMENT_THREAD },
            { type: '10', value: ChannelType.ANNOUNCEMENT_THREAD },

            // PUBLIC_THREAD
            { type: 'public_thread', value: ChannelType.PUBLIC_THREAD },
            { type: 'PUBLIC_THREAD', value: ChannelType.PUBLIC_THREAD },
            { type: 11, value: ChannelType.PUBLIC_THREAD },
            { type: '11', value: ChannelType.PUBLIC_THREAD },

            // PRIVATE_THREAD
            { type: 'private_thread', value: ChannelType.PRIVATE_THREAD },
            { type: 'PRIVATE_THREAD', value: ChannelType.PRIVATE_THREAD },
            { type: 12, value: ChannelType.PRIVATE_THREAD },
            { type: '12', value: ChannelType.PRIVATE_THREAD },

            // GUILD_STAGE_VOICE
            { type: 'guild_stage_voice', value: ChannelType.GUILD_STAGE_VOICE },
            { type: 'GUILD_STAGE_VOICE', value: ChannelType.GUILD_STAGE_VOICE },
            { type: 13, value: ChannelType.GUILD_STAGE_VOICE },
            { type: '13', value: ChannelType.GUILD_STAGE_VOICE },

            // GUILD_DIRECTORY
            { type: 'guild_directory', value: ChannelType.GUILD_DIRECTORY },
            { type: 'GUILD_DIRECTORY', value: ChannelType.GUILD_DIRECTORY },
            { type: 14, value: ChannelType.GUILD_DIRECTORY },
            { type: '14', value: ChannelType.GUILD_DIRECTORY },

            // GUILD_FORUM
            { type: 'guild_forum', value: ChannelType.GUILD_FORUM },
            { type: 'GUILD_FORUM', value: ChannelType.GUILD_FORUM },
            { type: 15, value: ChannelType.GUILD_FORUM },
            { type: '15', value: ChannelType.GUILD_FORUM },

            // GUILD_MEDIA
            { type: 'guild_media', value: ChannelType.GUILD_MEDIA },
            { type: 'GUILD_MEDIA', value: ChannelType.GUILD_MEDIA },
            { type: 16, value: ChannelType.GUILD_MEDIA },
            { type: '16', value: ChannelType.GUILD_MEDIA },

            // Aliases (lowercase and uppercase)
            { type: 'text', value: ChannelType.GUILD_TEXT },
            { type: 'TEXT', value: ChannelType.GUILD_TEXT },
            { type: 'voice', value: ChannelType.GUILD_VOICE },
            { type: 'VOICE', value: ChannelType.GUILD_VOICE },
            { type: 'category', value: ChannelType.GUILD_CATEGORY },
            { type: 'CATEGORY', value: ChannelType.GUILD_CATEGORY },
            { type: 'news', value: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'NEWS', value: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'announcement', value: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'ANNOUNCEMENT', value: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'stage_voice', value: ChannelType.GUILD_STAGE_VOICE },
            { type: 'STAGE_VOICE', value: ChannelType.GUILD_STAGE_VOICE },
            { type: 'directory', value: ChannelType.GUILD_DIRECTORY },
            { type: 'DIRECTORY', value: ChannelType.GUILD_DIRECTORY },
            { type: 'forum', value: ChannelType.GUILD_FORUM },
            { type: 'FORUM', value: ChannelType.GUILD_FORUM },
            { type: 'media', value: ChannelType.GUILD_MEDIA },
            { type: 'MEDIA', value: ChannelType.GUILD_MEDIA },

            // Hyphens are treated as underscores
            { type: 'stage-voice', value: ChannelType.GUILD_STAGE_VOICE },
            { type: 'guild-text', value: ChannelType.GUILD_TEXT },
            { type: 'group-dm', value: ChannelType.GROUP_DM },
            { type: 'guild-voice', value: ChannelType.GUILD_VOICE },
            { type: 'guild-category', value: ChannelType.GUILD_CATEGORY },
            { type: 'guild-announcement', value: ChannelType.GUILD_ANNOUNCEMENT },
            { type: 'announcement-thread', value: ChannelType.ANNOUNCEMENT_THREAD },
            { type: 'public-thread', value: ChannelType.PUBLIC_THREAD },
            { type: 'private-thread', value: ChannelType.PRIVATE_THREAD },
            { type: 'guild-stage-voice', value: ChannelType.GUILD_STAGE_VOICE },
            { type: 'guild-directory', value: ChannelType.GUILD_DIRECTORY },
            { type: 'guild-forum', value: ChannelType.GUILD_FORUM },
            { type: 'guild-media', value: ChannelType.GUILD_MEDIA }
        ].map(({ type, value }) => ({
            title: `Edit channel type to ${JSON.stringify(type)}`,
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({ type })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelEditLocals>) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_TEXT);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    type: value
                }))).resolves(true).mustHappen(1);
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
            title: `Edit channel with video quality mode ${JSON.stringify(videoQualityMode)}`,
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({ videoQualityMode })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelEditLocals>) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_VOICE);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    videoQualityMode: value
                }))).resolves(true).mustHappen(1);
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
            { defaultAutoArchiveDuration: 4320, value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: '4320', value: AutoArchiveDuration.DAY_3 },
            { defaultAutoArchiveDuration: 'week', value: AutoArchiveDuration.WEEK },
            { defaultAutoArchiveDuration: 'WEEK', value: AutoArchiveDuration.WEEK },
            { defaultAutoArchiveDuration: 10080, value: AutoArchiveDuration.WEEK },
            { defaultAutoArchiveDuration: '10080', value: AutoArchiveDuration.WEEK }
        ].map(({ defaultAutoArchiveDuration, value }) => ({
            title: `Edit channel with default auto archive duration ${JSON.stringify(defaultAutoArchiveDuration)}`,
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({ defaultAutoArchiveDuration })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelEditLocals>) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_FORUM);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    defaultAutoArchiveDuration: value
                }))).resolves(true).mustHappen(1);
            }
        })),
        ...[
            { defaultSortOrder: 'latest_activity', value: ForumSortOrder.LATEST_ACTIVITY },
            { defaultSortOrder: 'LATEST_ACTIVITY', value: ForumSortOrder.LATEST_ACTIVITY },
            { defaultSortOrder: 0, value: ForumSortOrder.LATEST_ACTIVITY },
            { defaultSortOrder: '0', value: ForumSortOrder.LATEST_ACTIVITY },
            { defaultSortOrder: 'creation_date', value: ForumSortOrder.CREATION_DATE },
            { defaultSortOrder: 'CREATION_DATE', value: ForumSortOrder.CREATION_DATE },
            { defaultSortOrder: 1, value: ForumSortOrder.CREATION_DATE },
            { defaultSortOrder: '1', value: ForumSortOrder.CREATION_DATE }
        ].map(({ defaultSortOrder, value }) => ({
            title: `Edit channel with default sort order ${JSON.stringify(defaultSortOrder)}`,
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({ defaultSortOrder })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelEditLocals>) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_FORUM);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    defaultSortOrder: value
                }))).resolves(true).mustHappen(1);
            }
        })),
        ...[
            { defaultForumLayout: 'not_set', value: ForumLayoutType.NOT_SET },
            { defaultForumLayout: 'NOT_SET', value: ForumLayoutType.NOT_SET },
            { defaultForumLayout: 0, value: ForumLayoutType.NOT_SET },
            { defaultForumLayout: '0', value: ForumLayoutType.NOT_SET },
            { defaultForumLayout: 'list_view', value: ForumLayoutType.LIST_VIEW },
            { defaultForumLayout: 'LIST_VIEW', value: ForumLayoutType.LIST_VIEW },
            { defaultForumLayout: 1, value: ForumLayoutType.LIST_VIEW },
            { defaultForumLayout: '1', value: ForumLayoutType.LIST_VIEW },
            { defaultForumLayout: 'gallery_view', value: ForumLayoutType.GALLERY_VIEW },
            { defaultForumLayout: 'GALLERY_VIEW', value: ForumLayoutType.GALLERY_VIEW },
            { defaultForumLayout: 2, value: ForumLayoutType.GALLERY_VIEW },
            { defaultForumLayout: '2', value: ForumLayoutType.GALLERY_VIEW }
        ].map(({ defaultForumLayout, value }) => ({
            title: `Edit channel with default forum layout ${JSON.stringify(defaultForumLayout)}`,
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({ defaultForumLayout })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelEditLocals>) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_FORUM);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    defaultForumLayout: value
                }))).resolves(true).mustHappen(1);
            }
        })),
        ...[
            { autoArchiveDuration: 'hour', value: AutoArchiveDuration.HOUR },
            { autoArchiveDuration: 'HOUR', value: AutoArchiveDuration.HOUR },
            { autoArchiveDuration: 60, value: AutoArchiveDuration.HOUR },
            { autoArchiveDuration: '60', value: AutoArchiveDuration.HOUR },
            { autoArchiveDuration: 'day', value: AutoArchiveDuration.DAY },
            { autoArchiveDuration: 'DAY', value: AutoArchiveDuration.DAY },
            { autoArchiveDuration: 1440, value: AutoArchiveDuration.DAY },
            { autoArchiveDuration: '1440', value: AutoArchiveDuration.DAY },
            { autoArchiveDuration: 'day_3', value: AutoArchiveDuration.DAY_3 },
            { autoArchiveDuration: 'DAY_3', value: AutoArchiveDuration.DAY_3 },
            { autoArchiveDuration: 4320, value: AutoArchiveDuration.DAY_3 },
            { autoArchiveDuration: '4320', value: AutoArchiveDuration.DAY_3 },
            { autoArchiveDuration: 'week', value: AutoArchiveDuration.WEEK },
            { autoArchiveDuration: 'WEEK', value: AutoArchiveDuration.WEEK },
            { autoArchiveDuration: 10080, value: AutoArchiveDuration.WEEK },
            { autoArchiveDuration: '10080', value: AutoArchiveDuration.WEEK }
        ].map(({ autoArchiveDuration, value }) => ({
            title: `Edit thread with auto archive duration ${JSON.stringify(autoArchiveDuration)}`,
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({ autoArchiveDuration })}}}`,
            expected: channelId.toString(),
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx: SubtagTestContext<GuildChannelEditLocals>) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.PUBLIC_THREAD);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({
                    autoArchiveDuration: value
                }))).resolves(true).mustHappen(1);
            }
        })),
        ...[
            { title: 'Invalid channel type name', channelType: ChannelType.GUILD_TEXT, options: { type: 'garbage' } },
            { title: 'Invalid channel type number', channelType: ChannelType.GUILD_TEXT, options: { type: 99 } },
            { title: 'Invalid channel type numeric string', channelType: ChannelType.GUILD_TEXT, options: { type: '99' } },
            { title: 'Invalid video quality mode name', channelType: ChannelType.GUILD_VOICE, options: { videoQualityMode: 'garbage' } },
            { title: 'Invalid video quality mode number', channelType: ChannelType.GUILD_VOICE, options: { videoQualityMode: 99 } },
            { title: 'Invalid video quality mode zero', channelType: ChannelType.GUILD_VOICE, options: { videoQualityMode: 0 } },
            { title: 'Invalid default auto archive duration name', channelType: ChannelType.GUILD_FORUM, options: { defaultAutoArchiveDuration: 'garbage' } },
            { title: 'Invalid default auto archive duration number', channelType: ChannelType.GUILD_FORUM, options: { defaultAutoArchiveDuration: 99 } },
            { title: 'Invalid default auto archive duration numeric string', channelType: ChannelType.GUILD_FORUM, options: { defaultAutoArchiveDuration: '99' } },
            { title: 'Invalid default sort order name', channelType: ChannelType.GUILD_FORUM, options: { defaultSortOrder: 'garbage' } },
            { title: 'Invalid default sort order number', channelType: ChannelType.GUILD_FORUM, options: { defaultSortOrder: 99 } },
            { title: 'Invalid default forum layout name', channelType: ChannelType.GUILD_FORUM, options: { defaultForumLayout: 'garbage' } },
            { title: 'Invalid default forum layout number', channelType: ChannelType.GUILD_FORUM, options: { defaultForumLayout: 99 } },
            { title: 'Invalid thread auto archive duration name', channelType: ChannelType.PUBLIC_THREAD, options: { autoArchiveDuration: 'garbage' } },
            { title: 'Invalid thread auto archive duration number', channelType: ChannelType.PUBLIC_THREAD, options: { autoArchiveDuration: 99 } },
            { title: 'Invalid thread auto archive duration numeric string', channelType: ChannelType.PUBLIC_THREAD, options: { autoArchiveDuration: '99' } },
            { title: 'Invalid thread auto archive duration zero', channelType: ChannelType.PUBLIC_THREAD, options: { autoArchiveDuration: 0 } }
        ].map(({ title, channelType, options }) => ({
            title,
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify(options)}}}`,
            expected: '`Invalid JSON`',
            replacers: [replacers.escapeBBTagReplacer],
            errors: [
                { error: new BBTagRuntimeError('Invalid JSON') }
            ],
            setup(ctx: SubtagTestContext<GuildChannelEditLocals>) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, channelType);
            }
        })),

        // Invalid options
        {
            title: 'Invalid JSON for non-thread channel',
            code: '{channeledit;1293671282973698;This isnt valid json!}',
            expected: '`Invalid JSON`',
            errors: [
                { error: new BBTagRuntimeError('Invalid JSON') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_TEXT);
            }
        },
        {
            title: 'Invalid JSON for thread',
            code: '{channeledit;1293671282973698;This isnt valid json!}',
            expected: '`Invalid JSON`',
            errors: [
                { error: new BBTagRuntimeError('Invalid JSON') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.PUBLIC_THREAD);
            }
        },

        // Channel lookup
        {
            title: 'Channel does not exist',
            code: '{channeledit;1293671282973698}',
            expected: '`Channel does not exist`',
            errors: [
                { error: new LegacyChannelNotFoundError('1293671282973698') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryChannel('1293671282973698', $({ throw: LegacyChannelNotFoundError })))
                    .rejects(new LegacyChannelNotFoundError('1293671282973698'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Channel type cannot be found',
            code: '{channeledit;1293671282973698}',
            expected: '`Channel does not exist`',
            errors: [
                { error: new LegacyChannelNotFoundError('1293671282973698') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);

                ctx.discord.setup(m => m.getChannelType(channelId))
                    .resolves(null)
                    .mustHappen(1);
            }
        },

        // Permissions needed to edit a channel
        {
            title: 'Author with only ADMINISTRATOR can edit channels',
            code: '{channeledit;1293671282973698}',
            expected: channelId.toString(),
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, new DiscordPermissions('ADMINISTRATOR'));
                setupChannelType(ctx, ChannelType.GUILD_TEXT);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({})))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'Author with only MANAGE_CHANNELS can edit channels',
            code: '{channeledit;1293671282973698}',
            expected: channelId.toString(),
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, new DiscordPermissions('MANAGE_CHANNELS'));
                setupChannelType(ctx, ChannelType.GUILD_TEXT);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({})))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'Bot with only ADMINISTRATOR can edit channels',
            code: '{channeledit;1293671282973698}',
            expected: channelId.toString(),
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions('ADMINISTRATOR'));
                setupChannelType(ctx, ChannelType.GUILD_TEXT);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({})))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'Bot with only MANAGE_CHANNELS can edit channels',
            code: '{channeledit;1293671282973698}',
            expected: channelId.toString(),
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions('MANAGE_CHANNELS'));
                setupChannelType(ctx, ChannelType.GUILD_TEXT);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({})))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'Author with no permissions cannot edit this channel',
            code: '{channeledit;1293671282973698}',
            expected: '`Author cannot edit this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);

                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
                    .resolves(new DiscordPermissions(0n))
                    .mustHappen(1);
            }
        },
        {
            title: 'Author with only unrelated permissions cannot edit this channel',
            code: '{channeledit;1293671282973698}',
            expected: '`Author cannot edit this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);

                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
                    .resolves(new DiscordPermissions('SEND_MESSAGES', 'VIEW_CHANNEL'))
                    .mustHappen(1);
            }
        },
        {
            title: 'Bot with no permissions cannot edit this channel',
            code: '{channeledit;1293671282973698}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new FailedToEditChannelNoPermsError() }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions(0n));
            }
        },
        {
            title: 'Bot with only unrelated permissions cannot edit this channel',
            code: '{channeledit;1293671282973698}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new FailedToEditChannelNoPermsError() }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions('SEND_MESSAGES', 'VIEW_CHANNEL'));
            }
        },

        // The order that checks are made in
        {
            title: 'Author and bot with no permissions cannot edit this channel',
            code: '{channeledit;1293671282973698}',
            expected: '`Author cannot edit this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);

                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
                    .resolves(new DiscordPermissions(0n))
                    .mustHappen(1);
            }
        },
        {
            title: 'Author permissions are checked before options are parsed',
            code: '{channeledit;1293671282973698;This isnt valid json!}',
            expected: '`Author cannot edit this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);

                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup(m => m.authorizerId)
                    .returns(authorizerId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
                    .resolves(new DiscordPermissions(0n))
                    .mustHappen(1);
            }
        },
        {
            title: 'Bot permissions are checked before options are parsed',
            code: '{channeledit;1293671282973698;This isnt valid json!}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new FailedToEditChannelNoPermsError() }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions(0n));
            }
        },
        {
            title: 'Bot permissions are checked before the channel type is looked up',
            code: '{channeledit;1293671282973698}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new FailedToEditChannelNoPermsError() }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx, undefined, new DiscordPermissions(0n));

                ctx.discord.setup(m => m.getChannelType(channelId))
                    .resolves(null)
                    .mustHappen(0);
            }
        },

        // Editing
        {
            title: 'Editing the channel fails',
            code: '{channeledit;1293671282973698}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new FailedToEditChannelNoPermsError() }
            ],
            setup(ctx) {
                setupChannelQuery(ctx);
                setupChannelPermissions(ctx);
                setupChannelType(ctx, ChannelType.GUILD_TEXT);

                ctx.discord.setup((m, $) => m.editChannel(channelId, $({})))
                    .resolves(false)
                    .mustHappen(1);
            }
        }
    ]
});

function setupChannelQuery(ctx: SubtagTestContext<GuildChannelEditLocals>): void {
    ctx.discord.setup((m, $) => m.queryChannel(channelId.toString(), $({ throw: LegacyChannelNotFoundError })))
        .resolves(channelId)
        .mustHappen(1);
}

function setupChannelType(
    ctx: SubtagTestContext<GuildChannelEditLocals>,
    type: ChannelType
): void {
    ctx.discord.setup(m => m.getChannelType(channelId))
        .resolves(type)
        .mustHappen(1);
}

function setupChannelPermissions(
    ctx: SubtagTestContext<GuildChannelEditLocals>,
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

    ctx.discord.setup(m => m.getPermissions(authorizerId, channelId))
        .resolves(authorizerPermissions)
        .mustHappen(1);

    ctx.discord.setup(m => m.getPermissions(botId, channelId))
        .resolves(botPermissions)
        .mustHappen(1);
}

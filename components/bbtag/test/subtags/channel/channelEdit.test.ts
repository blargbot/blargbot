import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { ChannelEditSubtag } from '@blargbot/bbtag/subtags/channel/channelEdit.js';
import { EscapeBBTagSubtag } from '@blargbot/bbtag/subtags/misc/escapeBBTag.js';
import { argument } from '@blargbot/test-util/mock.js';
import { ChannelType } from 'discord-api-types/v9';
import * as Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new ChannelEditSubtag(),
    argCountBounds: { min: 1, max: 2 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Eris.Constants.Permissions.manageChannels.toString();
    },
    cases: [
        {
            title: 'Channel is not a thread',
            code: '{channeledit;1293671282973698}',
            expected: '1293671282973698',
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '1293671282973698')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({
                    bitrate: undefined,
                    name: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    defaultAutoArchiveDuration: undefined,
                    locked: undefined,
                    rtcRegion: undefined,
                    archived: undefined,
                    autoArchiveDuration: undefined,
                    icon: undefined,
                    invitable: undefined,
                    ownerID: undefined,
                    videoQualityMode: undefined
                }), 'Command User#0000')).thenResolve(channel);
            }
        },
        {
            title: 'Channel is a thread',
            code: '{channeledit;1293671282973698}',
            expected: '1293671282973698',
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
                ctx.channels.general.type = ChannelType.GuildPublicThread;
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '1293671282973698')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({
                    bitrate: undefined,
                    name: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    defaultAutoArchiveDuration: undefined,
                    locked: undefined,
                    rtcRegion: undefined,
                    archived: undefined,
                    autoArchiveDuration: undefined,
                    icon: undefined,
                    invitable: undefined,
                    ownerID: undefined,
                    videoQualityMode: undefined
                }), 'Command User#0000')).thenResolve(channel);
            }
        },
        {
            title: 'Channel is not a thread',
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
            expected: '1293671282973698',
            subtags: [new EscapeBBTagSubtag()],
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '1293671282973698')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({
                    bitrate: 123,
                    name: 'new channel name',
                    nsfw: true,
                    parentID: '2836742834628346',
                    rateLimitPerUser: 456,
                    topic: 'New channel topic',
                    userLimit: 789,
                    defaultAutoArchiveDuration: 1440,
                    locked: true,
                    rtcRegion: undefined,
                    archived: undefined,
                    autoArchiveDuration: undefined,
                    icon: undefined,
                    invitable: undefined,
                    ownerID: undefined,
                    videoQualityMode: undefined
                }), 'Command User#0000')).thenResolve(channel);
            }
        },
        {
            title: 'Channel is a thread',
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({
                archived: true,
                autoArchiveDuration: 4320,
                locked: true,
                name: 'New thread name',
                rateLimitPerUser: 123,
                invitable: true
            })}}}`,
            expected: '1293671282973698',
            subtags: [new EscapeBBTagSubtag()],
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
                ctx.channels.general.type = ChannelType.GuildPublicThread;
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '1293671282973698')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({
                    archived: true,
                    autoArchiveDuration: 4320,
                    locked: true,
                    name: 'New thread name',
                    rateLimitPerUser: 123,
                    invitable: true,
                    bitrate: undefined,
                    defaultAutoArchiveDuration: undefined,
                    icon: undefined,
                    nsfw: undefined,
                    ownerID: undefined,
                    parentID: undefined,
                    rtcRegion: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    videoQualityMode: undefined
                }), 'Command User#0000')).thenResolve(channel);
            }
        },
        {
            title: 'Channel is not a thread',
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({
                bitrate: '123',
                name: 'new channel name',
                nsfw: 'true',
                parentID: '2836742834628346',
                rateLimitPerUser: '456',
                topic: 'New channel topic',
                userLimit: '789',
                defaultAutoArchiveDuration: '1440',
                locked: 'true'
            })}}}`,
            expected: '1293671282973698',
            subtags: [new EscapeBBTagSubtag()],
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '1293671282973698')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({
                    bitrate: 123,
                    name: 'new channel name',
                    nsfw: true,
                    parentID: '2836742834628346',
                    rateLimitPerUser: 456,
                    topic: 'New channel topic',
                    userLimit: 789,
                    defaultAutoArchiveDuration: 1440,
                    locked: true,
                    rtcRegion: undefined,
                    archived: undefined,
                    autoArchiveDuration: undefined,
                    icon: undefined,
                    invitable: undefined,
                    ownerID: undefined,
                    videoQualityMode: undefined
                }), 'Command User#0000')).thenResolve(channel);
            }
        },
        {
            title: 'Channel is a thread',
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({
                archived: 'true',
                autoArchiveDuration: '4320',
                locked: 'true',
                name: 'New thread name',
                rateLimitPerUser: '123',
                invitable: 'true'
            })}}}`,
            expected: '1293671282973698',
            subtags: [new EscapeBBTagSubtag()],
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
                ctx.channels.general.type = ChannelType.GuildPublicThread;
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '1293671282973698')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({
                    archived: true,
                    autoArchiveDuration: 4320,
                    locked: true,
                    name: 'New thread name',
                    rateLimitPerUser: 123,
                    invitable: true,
                    bitrate: undefined,
                    defaultAutoArchiveDuration: undefined,
                    icon: undefined,
                    nsfw: undefined,
                    ownerID: undefined,
                    parentID: undefined,
                    rtcRegion: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    videoQualityMode: undefined
                }), 'Command User#0000')).thenResolve(channel);
            }
        },
        {
            code: '{channeledit;1293671282973698}',
            expected: '`Channel does not exist`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Channel does not exist') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.guild, '1293671282973698')).thenResolve([]);
            }
        },
        {
            code: '{channeledit;1293671282973698}',
            expected: '`Author cannot edit this channel`',
            subtags: [new EscapeBBTagSubtag()],
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '1293671282973698')).thenResolve([channel]);
            }
        },
        {
            title: 'Channel is not a thread',
            code: `{channeledit;1293671282973698;{escapebbtag;${JSON.stringify({
                archived: true,
                autoArchiveDuration: 4320,
                locked: true,
                name: 'New thread name',
                rateLimitPerUser: 123,
                invitable: true
            })}}}`,
            expected: '`Invalid JSON`',
            subtags: [new EscapeBBTagSubtag()],
            errors: [
                { start: 0, end: 168, error: new BBTagRuntimeError('Invalid JSON') }
            ],
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '1293671282973698')).thenResolve([channel]);
            }
        },
        {
            title: 'Channel is a thread',
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
            expected: '`Invalid JSON`',
            subtags: [new EscapeBBTagSubtag()],
            errors: [
                { start: 0, end: 243, error: new BBTagRuntimeError('Invalid JSON') }
            ],
            setup(ctx) {
                ctx.channels.general.type = ChannelType.GuildPublicThread;
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '1293671282973698')).thenResolve([channel]);
            }
        },
        {
            code: '{channeledit;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(Eris.ApiError.MISSING_PERMISSIONS);
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.discord.setup(m => m.editChannel('2384762844234324', argument.isDeepEqual({
                    bitrate: undefined,
                    name: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    defaultAutoArchiveDuration: undefined,
                    locked: undefined,
                    rtcRegion: undefined,
                    archived: undefined,
                    autoArchiveDuration: undefined,
                    icon: undefined,
                    invitable: undefined,
                    ownerID: undefined,
                    videoQualityMode: undefined
                }), 'Command User#0000')).thenReject(err);
            }
        },
        {
            code: '{channeledit;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(Eris.ApiError.NOT_AUTHORIZED, 'Some other error message');
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.discord.setup(m => m.editChannel('2384762844234324', argument.isDeepEqual({
                    bitrate: undefined,
                    name: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    defaultAutoArchiveDuration: undefined,
                    locked: undefined,
                    rtcRegion: undefined,
                    archived: undefined,
                    autoArchiveDuration: undefined,
                    icon: undefined,
                    invitable: undefined,
                    ownerID: undefined,
                    videoQualityMode: undefined
                }), 'Command User#0000')).thenReject(err);
            }
        }
    ]
});

import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { ChannelEditSubtag } from '@cluster/subtags/channel/channeledit';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { ChannelType } from 'discord-api-types';
import { ApiError, Constants } from 'eris';

import { argument } from '../../../../mock';
import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ChannelEditSubtag(),
    argCountBounds: { min: 1, max: 2 },
    setup(ctx) {
        ctx.roles.command.permissions = Constants.Permissions.manageChannels.toString();
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
            subtags: [new EscapeBbtagSubtag()],
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
            subtags: [new EscapeBbtagSubtag()],
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
            subtags: [new EscapeBbtagSubtag()],
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = '0';
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
            subtags: [new EscapeBbtagSubtag()],
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
            subtags: [new EscapeBbtagSubtag()],
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
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to edit channel: no perms') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(ApiError.MISSING_PERMISSIONS);
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
            expected: '`Failed to edit channel: Some other error message`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to edit channel: Some other error message') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(ApiError.NOT_AUTHORIZED, 'Some other error message');
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

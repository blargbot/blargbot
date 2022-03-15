import { BBTagRuntimeError, ChannelNotFoundError, InvalidChannelError, MessageNotFoundError } from '@blargbot/cluster/bbtag/errors';
import { EscapeBbtagSubtag } from '@blargbot/cluster/subtags/misc/escapebbtag';
import { ThreadCreateSubtag } from '@blargbot/cluster/subtags/thread/threadcreate';
import { ChannelType, GuildFeature } from 'discord-api-types';
import { ApiError, KnownMessage, Message, PrivateThreadChannel, PublicThreadChannel, VoiceChannel } from 'eris';

import { argument } from '../../mock';
import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ThreadCreateSubtag(),
    argCountBounds: { min: 2, max: 3 },
    setup(ctx) {
        ctx.guild.features.push(GuildFeature.PrivateThreads, GuildFeature.ThreeDayThreadArchive, GuildFeature.SevenDayThreadArchive);
    },
    cases: [
        {
            code: '{threadcreate;28397468239463948;{escapebbtag;{"name":"My thread"}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '31298746236478234',
            postSetup(bbctx, ctx) {
                const result = ctx.createMock(PrivateThreadChannel);
                result.setup(m => m.id).thenReturn('31298746236478234');

                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
                ctx.discord.setup(m => m.createThreadWithoutMessage(channel.id, argument.isDeepEqual({
                    name: 'My thread',
                    autoArchiveDuration: 1440,
                    invitable: true,
                    type: ChannelType.GuildPublicThread
                }))).thenResolve(result.instance);
            }
        },
        {
            code: '{threadcreate;28397468239463948;928376462496394243;{escapebbtag;{"name":"My thread"}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '31298746236478234',
            postSetup(bbctx, ctx) {
                const result = ctx.createMock(PublicThreadChannel);
                result.setup(m => m.id).thenReturn('31298746236478234');

                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                const message = ctx.createMock<KnownMessage>(Message);
                message.setup(m => m.id).thenReturn('928376462496394243');

                ctx.util.setup(m => m.getMessage(channel, '928376462496394243')).thenResolve(message.instance);
                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
                ctx.discord.setup(m => m.createThreadWithMessage(channel.id, '928376462496394243', argument.isDeepEqual({
                    name: 'My thread',
                    autoArchiveDuration: 1440
                }))).thenResolve(result.instance);
            }
        },
        {
            code: '{threadcreate;28397468239463948;{escapebbtag;{"name":"My thread","autoArchiveDuration":60,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '31298746236478234',
            postSetup(bbctx, ctx) {
                const result = ctx.createMock(PrivateThreadChannel);
                result.setup(m => m.id).thenReturn('31298746236478234');

                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
                ctx.discord.setup(m => m.createThreadWithoutMessage(channel.id, argument.isDeepEqual({
                    name: 'My thread',
                    autoArchiveDuration: 60,
                    invitable: true,
                    type: ChannelType.GuildPrivateThread
                }))).thenResolve(result.instance);
            }
        },
        {
            code: '{threadcreate;28397468239463948;928376462496394243;{escapebbtag;{"name":"My thread","autoArchiveDuration":60,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '31298746236478234',
            postSetup(bbctx, ctx) {
                const result = ctx.createMock(PublicThreadChannel);
                result.setup(m => m.id).thenReturn('31298746236478234');

                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                const message = ctx.createMock<KnownMessage>(Message);
                message.setup(m => m.id).thenReturn('928376462496394243');

                ctx.util.setup(m => m.getMessage(channel, '928376462496394243')).thenResolve(message.instance);
                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
                ctx.discord.setup(m => m.createThreadWithMessage(channel.id, '928376462496394243', argument.isDeepEqual({
                    name: 'My thread',
                    autoArchiveDuration: 60
                }))).thenResolve(result.instance);
            }
        },
        {
            code: '{threadcreate;28397468239463948;{escapebbtag;{"name":"My thread","autoArchiveDuration":60,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Guild cannot have private threads`',
            errors: [
                { start: 0, end: 107, error: new BBTagRuntimeError('Guild cannot have private threads') }
            ],
            setup(ctx) {
                ctx.guild.features = [GuildFeature.ThreeDayThreadArchive, GuildFeature.SevenDayThreadArchive];
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;928376462496394243;{escapebbtag;{"name":"My thread","autoArchiveDuration":60,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Guild cannot have private threads`',
            errors: [
                { start: 0, end: 126, error: new BBTagRuntimeError('Guild cannot have private threads') }
            ],
            setup(ctx) {
                ctx.guild.features = [GuildFeature.ThreeDayThreadArchive, GuildFeature.SevenDayThreadArchive];
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                const message = ctx.createMock<KnownMessage>(Message);

                ctx.util.setup(m => m.getMessage(channel, '928376462496394243')).thenResolve(message.instance);
                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;{escapebbtag;{"name":"My thread","autoArchiveDuration":4320,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Guild does not have 3 day threads`',
            errors: [
                { start: 0, end: 109, error: new BBTagRuntimeError('Guild does not have 3 day threads') }
            ],
            setup(ctx) {
                ctx.guild.features = [GuildFeature.PrivateThreads, GuildFeature.SevenDayThreadArchive];
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;928376462496394243;{escapebbtag;{"name":"My thread","autoArchiveDuration":4320,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Guild does not have 3 day threads`',
            errors: [
                { start: 0, end: 128, error: new BBTagRuntimeError('Guild does not have 3 day threads') }
            ],
            setup(ctx) {
                ctx.guild.features = [GuildFeature.PrivateThreads, GuildFeature.SevenDayThreadArchive];
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                const message = ctx.createMock<KnownMessage>(Message);

                ctx.util.setup(m => m.getMessage(channel, '928376462496394243')).thenResolve(message.instance);
                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;{escapebbtag;{"name":"My thread","autoArchiveDuration":10080,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Guild does not have 7 day threads`',
            errors: [
                { start: 0, end: 110, error: new BBTagRuntimeError('Guild does not have 7 day threads') }
            ],
            setup(ctx) {
                ctx.guild.features = [GuildFeature.PrivateThreads, GuildFeature.ThreeDayThreadArchive];
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;928376462496394243;{escapebbtag;{"name":"My thread","autoArchiveDuration":10080,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Guild does not have 7 day threads`',
            errors: [
                { start: 0, end: 129, error: new BBTagRuntimeError('Guild does not have 7 day threads') }
            ],
            setup(ctx) {
                ctx.guild.features = [GuildFeature.PrivateThreads, GuildFeature.ThreeDayThreadArchive];
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                const message = ctx.createMock<KnownMessage>(Message);

                ctx.util.setup(m => m.getMessage(channel, '928376462496394243')).thenResolve(message.instance);
                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;{escapebbtag;{"name":"My thread","autoArchiveDuration":60,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`No channel found`',
            errors: [
                { start: 0, end: 107, error: new ChannelNotFoundError('28397468239463948') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;928376462496394243;{escapebbtag;{"name":"My thread","autoArchiveDuration":60,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`No channel found`',
            errors: [
                { start: 0, end: 126, error: new ChannelNotFoundError('28397468239463948') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;{escapebbtag;{"name":"My thread","autoArchiveDuration":60,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Channel cannot be a voice channel`',
            errors: [
                { start: 0, end: 107, error: new InvalidChannelError(ChannelType.GuildVoice, '28397468239463948') }
            ],
            postSetup(bbctx, ctx) {
                const channel = ctx.createMock(VoiceChannel);
                channel.setup(m => m.type).thenReturn(ChannelType.GuildVoice);
                channel.setup(m => m.id).thenReturn('28397468239463948');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel.instance]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;928376462496394243;{escapebbtag;{"name":"My thread","autoArchiveDuration":60,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Channel cannot be a voice channel`',
            errors: [
                { start: 0, end: 126, error: new InvalidChannelError(ChannelType.GuildVoice, '28397468239463948') }
            ],
            postSetup(bbctx, ctx) {
                const channel = ctx.createMock(VoiceChannel);
                channel.setup(m => m.type).thenReturn(ChannelType.GuildVoice);
                channel.setup(m => m.id).thenReturn('28397468239463948');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel.instance]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;928376462496394243;{escapebbtag;{"name":"My thread","autoArchiveDuration":60,"private":true}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`No message found`',
            errors: [
                { start: 0, end: 126, error: new MessageNotFoundError('28397468239463948', '928376462496394243') }
            ],
            setup(ctx) {
                ctx.channels.general.id = '28397468239463948';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                ctx.util.setup(m => m.getMessage(channel, '928376462496394243')).thenResolve(undefined);
                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;This isnt valid options}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Invalid options object`',
            errors: [
                { start: 0, end: 56, error: new BBTagRuntimeError('Invalid options object') }
            ],
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;928376462496394243;This isnt valid options}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Invalid options object`',
            errors: [
                { start: 0, end: 75, error: new BBTagRuntimeError('Invalid options object') }
            ],
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                const message = ctx.createMock<KnownMessage>(Message);

                ctx.util.setup(m => m.getMessage(channel, '928376462496394243')).thenResolve(message.instance);
                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
            }
        },
        {
            code: '{threadcreate;28397468239463948;{escapebbtag;{"name":"My thread"}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Failed to create thread: Some error message`',
            errors: [
                { start: 0, end: 67, error: new BBTagRuntimeError('Failed to create thread: Some error message') }
            ],
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(ApiError.MISSING_PERMISSIONS, 'Some error message');
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
                ctx.discord.setup(m => m.createThreadWithoutMessage(channel.id, argument.isDeepEqual({
                    name: 'My thread',
                    autoArchiveDuration: 1440,
                    invitable: true,
                    type: ChannelType.GuildPublicThread
                }))).thenReject(err);
            }
        },
        {
            code: '{threadcreate;28397468239463948;928376462496394243;{escapebbtag;{"name":"My thread"}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '`Failed to create thread: Some error message`',
            errors: [
                { start: 0, end: 86, error: new BBTagRuntimeError('Failed to create thread: Some error message') }
            ],
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(ApiError.MISSING_PERMISSIONS, 'Some error message');
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to get channel under test');

                const message = ctx.createMock<KnownMessage>(Message);
                message.setup(m => m.id).thenReturn('928376462496394243');

                ctx.util.setup(m => m.getMessage(channel, '928376462496394243')).thenResolve(message.instance);
                ctx.util.setup(m => m.findChannels(bbctx.guild, '28397468239463948')).thenResolve([channel]);
                ctx.discord.setup(m => m.createThreadWithMessage(channel.id, '928376462496394243', argument.isDeepEqual({
                    name: 'My thread',
                    autoArchiveDuration: 1440
                }))).thenReject(err);
            }
        }
    ]
});

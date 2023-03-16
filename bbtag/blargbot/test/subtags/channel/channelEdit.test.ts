import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { ChannelEditSubtag, EscapeBBTagSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelEditSubtag),
    argCountBounds: { min: 1, max: 2 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageChannels.toString();
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
                const channel = ctx.channels.general;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '1293671282973698')).thenResolve(channel);
                ctx.dependencies.channels.setup(m => m.edit(bbctx.runtime, channel.id, argument.isDeepEqual({
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
                }))).thenResolve();
            }
        },
        {
            title: 'Channel is a thread',
            code: '{channeledit;1293671282973698}',
            expected: '1293671282973698',
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
                ctx.channels.general.type = Discord.ChannelType.GuildPublicThread;
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '1293671282973698')).thenResolve(channel);
                ctx.dependencies.channels.setup(m => m.edit(bbctx.runtime, channel.id, argument.isDeepEqual({
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
                }))).thenResolve();
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
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '1293671282973698')).thenResolve(channel);
                ctx.dependencies.channels.setup(m => m.edit(bbctx.runtime, channel.id, argument.isDeepEqual({
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
                }))).thenResolve();
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
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
                ctx.channels.general.type = Discord.ChannelType.GuildPublicThread;
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '1293671282973698')).thenResolve(channel);
                ctx.dependencies.channels.setup(m => m.edit(bbctx.runtime, channel.id, argument.isDeepEqual({
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
                }))).thenResolve();
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
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '1293671282973698')).thenResolve(channel);
                ctx.dependencies.channels.setup(m => m.edit(bbctx.runtime, channel.id, argument.isDeepEqual({
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
                }))).thenResolve();
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
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            setup(ctx) {
                ctx.channels.general.id = '1293671282973698';
                ctx.channels.general.type = Discord.ChannelType.PublicThread;
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '1293671282973698')).thenResolve(channel);
                ctx.dependencies.channels.setup(m => m.edit(bbctx.runtime, channel.id, argument.isDeepEqual({
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
                }))).thenResolve();
            }
        },
        {
            code: '{channeledit;1293671282973698}',
            expected: '`Channel does not exist`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Channel does not exist') }
            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '1293671282973698')).thenResolve();
            }
        },
        {
            code: '{channeledit;1293671282973698}',
            expected: '`Author cannot edit this channel`',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '1293671282973698')).thenResolve(channel);
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
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            errors: [
                { start: 0, end: 168, error: new BBTagRuntimeError('Invalid JSON') }
            ],
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '1293671282973698')).thenResolve(channel);
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
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            errors: [
                { start: 0, end: 243, error: new BBTagRuntimeError('Invalid JSON') }
            ],
            setup(ctx) {
                ctx.channels.general.type = Discord.ChannelType.PublicThread;
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '1293671282973698')).thenResolve(channel);
            }
        },
        {
            code: '{channeledit;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '2384762844234324')).thenResolve(ctx.channels.command);
                ctx.dependencies.channels.setup(m => m.edit(bbctx.runtime, ctx.channels.command.id, argument.isDeepEqual({
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
                }))).thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{channeledit;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '2384762844234324')).thenResolve(ctx.channels.command);
                ctx.dependencies.channels.setup(m => m.edit(bbctx.runtime, ctx.channels.command.id, argument.isDeepEqual({
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
                }))).thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});

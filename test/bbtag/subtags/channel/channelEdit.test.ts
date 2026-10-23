import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import type { EditChannelThunk, GetUserPermissionsThunk } from '@blargbot/bbtag/subtags';
import { ChannelEditSubtag, ChannelIdSubtag, ChannelIsThreadSubtag, EscapeBBTagSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const editChannel = new Mock<EditChannelThunk>({ id: 'editChannel', callable: true });
const getUserPermissions = new Mock<GetUserPermissionsThunk>({ id: 'getUserPermissions', callable: true });
const channelIsThreadSubtag = new Mock<ChannelIsThreadSubtag>({ id: 'channelIsThreadSubtag' });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'channelIdSubtag' });

await runSubtagTests({
    subtag: new ChannelEditSubtag({
        editChannel: editChannel.instance,
        getUserPermissions: getUserPermissions.instance
    }),
    otherSubtags: [
        channelIsThreadSubtag.instance,
        channelIdSubtag.instance
    ],
    argCountBounds: { min: 1, max: 2 },
    names: ['channelEdit'],
    setup(ctx) {
        ctx.adoptMock(editChannel);
        ctx.adoptMock(getUserPermissions);
        ctx.adoptSubtagMock(channelIsThreadSubtag, { type: ChannelIsThreadSubtag });
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
    },
    cases: [
        {
            title: 'Channel is not a thread',
            code: '{channeledit;1293671282973698}',
            expected: '1293671282973698',
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '1293671282973698', undefined)).resolves('1293671282973698').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '1293671282973698')).resolves(false).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, '1293671282973698', $({
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
                    videoQualityMode: undefined,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            title: 'Channel is a thread',
            code: '{channeledit;1293671282973698}',
            expected: '1293671282973698',
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '1293671282973698', undefined)).resolves('1293671282973698').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '1293671282973698')).resolves(true).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, '1293671282973698', $({
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
                    videoQualityMode: undefined,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true });
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
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '1293671282973698', undefined)).resolves('1293671282973698').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '1293671282973698')).resolves(false).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, '1293671282973698', $({
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
                    videoQualityMode: undefined,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true });
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
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '1293671282973698', undefined)).resolves('1293671282973698').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '1293671282973698')).resolves(true).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, '1293671282973698', $({
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
                    videoQualityMode: undefined,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true });
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
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '1293671282973698', undefined)).resolves('1293671282973698').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '1293671282973698')).resolves(false).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, '1293671282973698', $({
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
                    videoQualityMode: undefined,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true });
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
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '1293671282973698', undefined)).resolves('1293671282973698').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '1293671282973698')).resolves(true).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, '1293671282973698', $({
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
                    videoQualityMode: undefined,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true });
            }
        },
        {
            code: '{channeledit;1293671282973698}',
            expected: '`Channel does not exist`',
            errors: [
                { error: new BBTagRuntimeError('Channel does not exist') }
            ],
            postSetup(bbctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '1293671282973698', undefined)).resolves(undefined).mustHappen(1);
            }
        },
        {
            code: '{channeledit;1293671282973698}',
            expected: '`Author cannot edit this channel`',
            subtags: [new EscapeBBTagSubtag()],
            errors: [
                { error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '1293671282973698', undefined)).resolves('1293671282973698').mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(DiscordPermissions.NONE).mustHappen(1);
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
                { error: new BBTagRuntimeError('Invalid JSON') }
            ],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '1293671282973698', undefined)).resolves('1293671282973698').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '1293671282973698')).resolves(false).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
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
                { error: new BBTagRuntimeError('Invalid JSON') }
            ],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '1293671282973698', undefined)).resolves('1293671282973698').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '1293671282973698')).resolves(true).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
            }
        },
        {
            code: '{channeledit;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '2384762844234324', undefined)).resolves('1293671282973698').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '1293671282973698')).resolves(true).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, '1293671282973698', $({
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
                    videoQualityMode: undefined,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: false, reason: 'Test REST error' });
            }
        },
        {
            code: '{channeledit;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '2384762844234324', undefined)).resolves('1293671282973698').mustHappen(1);
                channelIsThreadSubtag.setup(m => m.check(bbctx, '1293671282973698')).resolves(true).mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id, '1293671282973698')).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, '1293671282973698', $({
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
                    videoQualityMode: undefined,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: false, reason: 'Some other error message' });
            }
        }
    ]
});

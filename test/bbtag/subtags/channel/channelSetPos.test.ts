import { BBTagRuntimeError, DiscordPermissions, NotANumberError } from '@blargbot/bbtag';
import type { EditChannelFeature, GetMemberPermissionsFeature } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, ChannelSetPositionSubtag, ReasonSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<EditChannelFeature & GetMemberPermissionsFeature>({ id: 'features' });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'ChannelIdSubtag' });
const reasonSubtag = new Mock<ReasonSubtag>({ id: 'ReasonSubtag' });

await runSubtagTests({
    subtag: new ChannelSetPositionSubtag(features.instance),
    otherSubtags: [channelIdSubtag.instance, reasonSubtag.instance],
    argCountBounds: { min: 2, max: 2 },
    names: ['channelSetPosition', 'channelSetPos'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
        ctx.adoptSubtagMock(reasonSubtag, { type: ReasonSubtag });
    },
    postSetup(bbctx) {
        reasonSubtag.setup(m => m.get(bbctx)).resolves('@command.user');
    },
    cases: [
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup(m => m.query(bbctx, '239874692346327846', undefined)).resolves(channelId).mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, channelId)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                features.setup((m, $) => m.editChannel($({
                    guildId: ctx.guildId,
                    channelId,
                    position: 123,
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;abc}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup(m => m.query(bbctx, '239874692346327846', undefined)).resolves(channelId).mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, channelId)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Channel does not exist`',
            errors: [
                { error: new BBTagRuntimeError('Channel does not exist') }
            ],
            postSetup(bbctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '239874692346327846', undefined)).resolves(undefined).mustHappen(1);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Author cannot move this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot move this channel') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup(m => m.query(bbctx, '239874692346327846', undefined)).resolves(channelId).mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, channelId)).resolves(DiscordPermissions.NONE).mustHappen(1);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { error: new BBTagRuntimeError('Failed to move channel: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup(m => m.query(bbctx, '239874692346327846', undefined)).resolves(channelId).mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, channelId)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                features.setup((m, $) => m.editChannel($({
                    guildId: ctx.guildId,
                    channelId,
                    position: 123,
                    auditReason: '@command.user'
                }))).resolves({ success: false, reason: 'Test REST error' }).mustHappen(1);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { error: new BBTagRuntimeError('Failed to move channel: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup(m => m.query(bbctx, '239874692346327846', undefined)).resolves(channelId).mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, channelId)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                features.setup((m, $) => m.editChannel($({
                    guildId: ctx.guildId,
                    channelId,
                    position: 123,
                    auditReason: '@command.user'
                }))).resolves({ success: false, reason: 'Some other error message' }).mustHappen(1);
            }
        }
    ]
});

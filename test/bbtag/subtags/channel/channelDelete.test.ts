import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import type { DeleteChannelFeature, GetMemberPermissionsFeature } from '@blargbot/bbtag/subtags';
import { ChannelDeleteSubtag, ReasonSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<DeleteChannelFeature & GetMemberPermissionsFeature>({ id: 'features' });
const reasonSubtag = createMockSubtag(ReasonSubtag);

await runSubtagTests({
    subtag: new ChannelDeleteSubtag(features.instance),
    argCountBounds: { min: 1, max: 1 },
    names: ['channelDelete'],
    otherSubtags: [reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(reasonSubtag);
        reasonSubtag.setup(m => m.get(ctx.bbtag)).resolves('@command.user');
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: false,
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['channeldelete', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Channel does not exist'),
            cases: [
                {
                    title: 'Authorizer is admin',
                    expected: '',
                    setup(channelId, ctx) {
                        features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, channelId)).resolves(DiscordPermissions.NONE.inverse()).mustHappen(1);
                        features.setup((m, $) => m.deleteChannel($({
                            guildId: ctx.guildId,
                            channelId,
                            auditReason: '@command.user'
                        }))).resolves({ success: true }).mustHappen(1);
                    }
                },
                {
                    title: 'Authorizer has MANAGE_CHANNELS only',
                    expected: '',
                    setup(channelId, ctx) {
                        features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, channelId)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                        features.setup((m, $) => m.deleteChannel($({
                            guildId: ctx.guildId,
                            channelId,
                            auditReason: '@command.user'
                        }))).resolves({ success: true }).mustHappen(1);
                    }
                },
                {
                    title: 'Authorizer has no permissions',
                    expected: '`Author cannot edit this channel`',
                    error: new BBTagRuntimeError('Author cannot edit this channel'),
                    setup(channelId, ctx) {
                        features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, channelId)).resolves(DiscordPermissions.NONE).mustHappen(1);
                    }
                },
                {
                    title: 'Authorizer has MANAGE_CHANNELS only',
                    expected: '`Failed to edit channel: no perms`',
                    error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Test REST error'),
                    setup(channelId, ctx) {
                        features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId, channelId)).resolves(DiscordPermissions.NONE.inverse()).mustHappen(1);
                        features.setup((m, $) => m.deleteChannel($({
                            guildId: ctx.guildId,
                            channelId,
                            auditReason: '@command.user'
                        }))).resolves({ success: false, reason: 'Test REST error' }).mustHappen(1);
                    }
                }
            ]
        })
    ]
});

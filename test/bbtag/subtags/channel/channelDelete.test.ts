import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import type { DeleteChannelFeature, GetMemberPermissionsFeature } from '@blargbot/bbtag/subtags';
import { ChannelDeleteSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<DeleteChannelFeature & GetMemberPermissionsFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelDeleteSubtag(features.instance),
    argCountBounds: { min: 1, max: 1 },
    names: ['channelDelete'],
    setup(ctx) {
        ctx.adoptMock(features);
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
                        features.setup(m => m.getMemberPermissions(ctx.guild.id, ctx.users.authorizer.id, channelId)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                        features.setup(m => m.deleteChannel(ctx.guild.id, channelId, 'Command User#0000')).resolves({ success: true }).mustHappen(1);
                    }
                },
                {
                    title: 'Authorizer has MANAGE_CHANNELS only',
                    expected: '',
                    setup(channelId, ctx) {
                        features.setup(m => m.getMemberPermissions(ctx.guild.id, ctx.users.authorizer.id, channelId)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                        features.setup(m => m.deleteChannel(ctx.guild.id, channelId, 'Command User#0000')).resolves({ success: true }).mustHappen(1);
                    }
                },
                {
                    title: 'Authorizer has no permissions',
                    expected: '`Author cannot edit this channel`',
                    error: new BBTagRuntimeError('Author cannot edit this channel'),
                    setup(channelId, ctx) {
                        features.setup(m => m.getMemberPermissions(ctx.guild.id, ctx.users.authorizer.id, channelId)).resolves(DiscordPermissions.NONE).mustHappen(1);
                    }
                },
                {
                    title: 'Authorizer has MANAGE_CHANNELS only',
                    expected: '`Failed to edit channel: no perms`',
                    error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Test REST error'),
                    setup(channelId, ctx) {
                        features.setup(m => m.getMemberPermissions(ctx.guild.id, ctx.users.authorizer.id, channelId)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                        features.setup(m => m.deleteChannel(ctx.guild.id, channelId, 'Command User#0000')).resolves({ success: false, reason: 'Test REST error' }).mustHappen(1);
                    }
                }
            ]
        })
    ]
});

import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import type { CheckMessageExistsFeature, GetMemberPermissionsFeature, RemoveMessageReactionsFeature } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, IsStaffSubtag, ReactionRemoveAllSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const features = new Mock<CheckMessageExistsFeature & GetMemberPermissionsFeature & RemoveMessageReactionsFeature>({ id: 'features' });
const channelIdSubtag = createMockSubtag(ChannelIdSubtag);
const isStaffSubtag = createMockSubtag(IsStaffSubtag);

await runSubtagTests({
    subtag: new ReactionRemoveAllSubtag(features.instance),
    argCountBounds: { min: 1, max: 2 },
    names: ['reactionRemoveAll', 'reactRemoveAll', 'removeReactAll'],
    otherSubtags: [
        isStaffSubtag.instance,
        channelIdSubtag.instance
    ],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(channelIdSubtag);
        ctx.adoptMock(isStaffSubtag);
    },
    cases: [
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => features.setup(m => m.checkMessageExists(c, i)),
            notExists: Promise.resolve(false),
            queryOptions: () => undefined,
            emptyIsCurrentMessage: false,
            generateCode(...args) {
                return `{${['reactremoveall', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'Bot is missing permissions',
                    expected: '`I need to be able to Manage Messages to remove reactions`',
                    error: new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions'),
                    setup(getProp, channelId, _, ctx) {
                        getProp.resolves(true);
                        features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                            .resolves(DiscordPermissions.NONE)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'User is staff',
                    expected: '',
                    setup(getProp, channelId, messageId, ctx) {
                        getProp.resolves(true);
                        features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                            .resolves(DiscordPermissions.MANAGE_MESSAGES)
                            .mustHappen(1);
                        features.setup(m => m.removeMessageReactions(channelId, messageId)).resolves(undefined).mustHappen(1);
                        isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined)).resolves(true).mustHappen(1);
                    }
                },
                {
                    title: 'User is not staff, but the message is owned',
                    expected: '',
                    setup(getProp, channelId, messageId, ctx) {
                        getProp.resolves(true);
                        features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                            .resolves(DiscordPermissions.MANAGE_MESSAGES)
                            .mustHappen(1);
                        features.setup(m => m.removeMessageReactions(channelId, messageId)).resolves(undefined).mustHappen(1);
                        ctx.bbtag.root.ownedMessageIds.add(messageId);
                    }
                },
                {
                    title: 'User is not staff',
                    expected: '`Author must be staff to modify unrelated messages`',
                    error: new BBTagRuntimeError('Author must be staff to modify unrelated messages'),
                    setup(getProp, channelId, _, ctx) {
                        getProp.resolves(true);
                        features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                            .resolves(DiscordPermissions.MANAGE_MESSAGES)
                            .mustHappen(1);
                        isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined)).resolves(false).mustHappen(1);
                    }
                }
            ]
        })
    ]
});

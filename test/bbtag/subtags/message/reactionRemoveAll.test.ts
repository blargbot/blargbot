import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import type { CheckMessageExistsThunk, GetUserPermissionsThunk, IsUserStaffThunk, RemoveMessageReactionsThunk } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, IsStaffSubtag, ReactionRemoveAllSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const isUserStaff = new Mock<IsUserStaffThunk>({ id: 'isUserStaff', callable: true });
const checkMessageExists = new Mock<CheckMessageExistsThunk>({ id: 'checkMessageExists', callable: true });
const getUserPermissions = new Mock<GetUserPermissionsThunk>({ id: 'getUserPermissions', callable: true });
const removeMessageReactions = new Mock<RemoveMessageReactionsThunk>({ id: 'removeMessageReactions', callable: true });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'channelIdSubtag' });

await runSubtagTests({
    subtag: new ReactionRemoveAllSubtag({
        checkMessageExists: checkMessageExists.instance,
        getUserPermissions: getUserPermissions.instance,
        removeMessageReactions: removeMessageReactions.instance
    }),
    argCountBounds: { min: 1, max: 2 },
    names: ['reactionRemoveAll', 'reactRemoveAll', 'removeReactAll'],
    otherSubtags: [
        new IsStaffSubtag({
            isUserStaff: isUserStaff.instance
        }),
        channelIdSubtag.instance
    ],
    setup(ctx) {
        ctx.adoptMock(isUserStaff);
        ctx.adoptMock(checkMessageExists);
        ctx.adoptMock(getUserPermissions);
        ctx.adoptMock(removeMessageReactions);
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
    },
    cases: [
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => checkMessageExists.setup(m => m(c, i)),
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
                        getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                            .resolves(DiscordPermissions.NONE)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'User is staff',
                    expected: '',
                    setup(getProp, channelId, messageId, ctx) {
                        getProp.resolves(true);
                        getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                            .resolves(DiscordPermissions.MANAGE_MESSAGES)
                            .mustHappen(1);
                        isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(true).mustHappen(1);
                        removeMessageReactions.setup(m => m(channelId, messageId)).resolves(undefined).mustHappen(1);
                    }
                },
                {
                    title: 'User is not staff, but the message is owned',
                    expected: '',
                    setup(getProp, channelId, messageId, ctx) {
                        getProp.resolves(true);
                        getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                            .resolves(DiscordPermissions.MANAGE_MESSAGES)
                            .mustHappen(1);
                        removeMessageReactions.setup(m => m(channelId, messageId)).resolves(undefined).mustHappen(1);
                    },
                    postSetup(bbctx, __, messageId) {
                        bbctx.root.ownedMessageIds.add(messageId);
                    }
                },
                {
                    title: 'User is not staff',
                    expected: '`Author must be staff to modify unrelated messages`',
                    error: new BBTagRuntimeError('Author must be staff to modify unrelated messages'),
                    setup(getProp, channelId, _, ctx) {
                        getProp.resolves(true);
                        getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                            .resolves(DiscordPermissions.MANAGE_MESSAGES)
                            .mustHappen(1);
                        isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(false).mustHappen(1);
                    }
                }
            ]
        })
    ]
});

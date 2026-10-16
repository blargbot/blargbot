import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { IsUserStaffThunk } from '@blargbot/bbtag/subtags';
import { IsStaffSubtag, ReactionRemoveAllSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const isUserStaff = new Mock<IsUserStaffThunk>({ id: 'isUserStaff', callable: true });

await runSubtagTests({
    subtag: new ReactionRemoveAllSubtag(),
    argCountBounds: { min: 1, max: 2 },
    names: ['reactionRemoveAll', 'reactRemoveAll', 'removeReactAll'],
    otherSubtags: [
        new IsStaffSubtag({
            isUserStaff: isUserStaff.instance
        })
    ],
    setup(ctx) {
        ctx.adoptMock(isUserStaff);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['reactremoveall', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'Bot is missing permissions',
                    expected: '`I need to be able to Manage Messages to remove reactions`',
                    error: new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions'),
                    setup(_, __, ctx) {
                        ctx.roles.bot.permissions = '0';
                    }
                },
                {
                    title: 'User is staff',
                    expected: '',
                    setup(channel, message, ctx) {
                        isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(true).mustHappen(1);
                        ctx.roles.bot.permissions = eris.Constants.Permissions.manageMessages.toString();
                        ctx.discord.setup(m => m.removeMessageReactions(channel.id, message.id)).resolves(undefined);
                    }
                },
                {
                    title: 'User is not staff, but the message is owned',
                    expected: '',
                    setup(channel, message, ctx) {
                        ctx.roles.bot.permissions = eris.Constants.Permissions.manageMessages.toString();
                        ctx.discord.setup(m => m.removeMessageReactions(channel.id, message.id)).resolves(undefined);
                    },
                    postSetup(_, message, bbctx) {
                        bbctx.root.ownedMessageIds.add(message.id);
                    }
                },
                {
                    title: 'User is not staff',
                    expected: '`Author must be staff to modify unrelated messages`',
                    error: new BBTagRuntimeError('Author must be staff to modify unrelated messages'),
                    setup(_, __, ctx) {
                        isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(false).mustHappen(1);
                        ctx.roles.bot.permissions = eris.Constants.Permissions.manageMessages.toString();
                    }
                }
            ]
        })
    ]
});

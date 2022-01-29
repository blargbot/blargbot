import { BBTagRuntimeError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { ReactRemoveAllSubtag } from '@cluster/subtags/message/reactremoveall';
import { Constants } from 'eris';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new ReactRemoveAllSubtag(),
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoMessageId: false,
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
                        ctx.isStaff = true;
                        ctx.roles.bot.permissions = Constants.Permissions.manageMessages.toString();
                        ctx.discord.setup(m => m.removeMessageReactions(channel.id, message.id)).thenResolve(undefined);
                    }
                },
                {
                    title: 'User is not staff, but the message is owned',
                    expected: '',
                    setup(channel, message, ctx) {
                        ctx.isStaff = false;
                        ctx.roles.bot.permissions = Constants.Permissions.manageMessages.toString();
                        ctx.discord.setup(m => m.removeMessageReactions(channel.id, message.id)).thenResolve(undefined);
                    },
                    postSetup(_, message, bbctx) {
                        bbctx.state.ownedMsgs.push(message.id);
                    }
                },
                {
                    title: 'User is not staff',
                    expected: '`Author must be staff to modify unrelated messages`',
                    error: new BBTagRuntimeError('Author must be staff to modify unrelated messages'),
                    setup(_, __, ctx) {
                        ctx.isStaff = false;
                        ctx.roles.bot.permissions = Constants.Permissions.manageMessages.toString();
                    }
                }
            ]
        }),
        {
            code: '{reactremoveall;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 23, end: 29, error: new MarkerError('eval', 23) },
                { start: 30, end: 36, error: new MarkerError('eval', 30) },
                { start: 0, end: 37, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});

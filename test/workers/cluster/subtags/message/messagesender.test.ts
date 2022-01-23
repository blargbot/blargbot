import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { MessageSenderSubtag } from '@cluster/subtags/message/messagesender';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new MessageSenderSubtag(),
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoMessageId: true,
            generateCode(...args) {
                return `{${['messagesender', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '09876554433211234567',
                    setup(_, message, ctx) {
                        message.author = ctx.users.other;
                        ctx.users.other.id = '09876554433211234567';
                    }
                }
            ]
        }),
        {
            code: '{messagesender;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 15, end: 21, error: new MarkerError('eval', 15) },
                { start: 22, end: 28, error: new MarkerError('eval', 22) },
                { start: 29, end: 35, error: new MarkerError('eval', 29) },
                { start: 36, end: 42, error: new MarkerError('eval', 36) },
                { start: 0, end: 43, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});

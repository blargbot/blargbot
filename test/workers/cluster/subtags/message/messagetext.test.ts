import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { MessageTextSubtag } from '@cluster/subtags/message/messagetext';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new MessageTextSubtag(),
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoMessageId: true,
            generateCode(...args) {
                return `{${['messagetext', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: 'This is some message content',
                    setup(_, message) {
                        message.content = 'This is some message content';
                    }
                },
                {
                    expected: 'abcxyz',
                    setup(_, message) {
                        message.content = 'abcxyz';
                    }
                }
            ]
        }),
        {
            code: '{messagetext;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 20, end: 26, error: new MarkerError('eval', 20) },
                { start: 27, end: 33, error: new MarkerError('eval', 27) },
                { start: 34, end: 40, error: new MarkerError('eval', 34) },
                { start: 0, end: 41, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});

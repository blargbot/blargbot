import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { MessageTimeSubtag } from '@cluster/subtags/message/messagetime';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new MessageTimeSubtag(),
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoMessageId: true,
            generateCode(...args) {
                return `{${['messagetime', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '1609459200000',
                    setup(_, message) {
                        message.timestamp = '2021-01-01T00:00:00+0000';
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoMessageId: true,
            generateCode(...args) {
                return `{${['messagetime', ...args, 'DD/MM/YYYY'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(_, message) {
                        message.timestamp = '2021-01-01T00:00:00+0000';
                    }
                }
            ]
        }),
        {
            code: '{messagetime;{eval};{eval};{eval};{eval}}',
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

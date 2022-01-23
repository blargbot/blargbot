import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { MessageEditTimeSubtag } from '@cluster/subtags/message/messageedittime';
import moment from 'moment-timezone';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new MessageEditTimeSubtag(),
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoMessageId: true,
            generateCode(...args) {
                return `{${['messageedittime', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'Not edited',
                    expected: () => moment.tz('Etc/UTC').format('x'),
                    setup(_, message) {
                        message.edited_timestamp = null;
                    },
                    retries: 10
                },
                {
                    title: 'Has been edited',
                    expected: '1609459200000',
                    setup(_, message) {
                        message.edited_timestamp = '2021-01-01T00:00:00+0000';
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoMessageId: true,
            generateCode(...args) {
                return `{${['messageedittime', ...args, 'DD/MM/YYYY'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'Not edited',
                    expected: () => moment.tz('Etc/UTC').format('DD/MM/YYYY'),
                    setup(_, message) {
                        message.edited_timestamp = null;
                    },
                    retries: 10
                },
                {
                    title: 'Has been edited',
                    expected: '01/01/2021',
                    setup(_, message) {
                        message.edited_timestamp = '2021-01-01T00:00:00+0000';
                    }
                }
            ]
        }),
        {
            code: '{messageedittime;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 17, end: 23, error: new MarkerError('eval', 17) },
                { start: 24, end: 30, error: new MarkerError('eval', 24) },
                { start: 31, end: 37, error: new MarkerError('eval', 31) },
                { start: 38, end: 44, error: new MarkerError('eval', 38) },
                { start: 0, end: 45, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});

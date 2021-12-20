import { BBTagRuntimeError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserBoostDataSubtag } from '@cluster/subtags/user/userboostdate';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserBoostDataSubtag(),
    cases: [
        {
            code: '{userboostdate}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                ctx.members.command.premium_since = '2021-01-01T00:00:00+0000';
            }
        },
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['userboostdate', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(user) {
                        user.premium_since = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: '`User not boosting`',
                    setup(user) {
                        user.premium_since = null;
                    },
                    error: new BBTagRuntimeError('User not boosting')
                },
                {
                    expected: '`User not boosting`',
                    setup(user) {
                        user.premium_since = undefined;
                    },
                    error: new BBTagRuntimeError('User not boosting')
                }
            ]
        }),
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['userboostdate', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(user) {
                        user.premium_since = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: '`User not boosting`',
                    setup(user) {
                        user.premium_since = null;
                    },
                    error: new BBTagRuntimeError('User not boosting')
                },
                {
                    expected: '`User not boosting`',
                    setup(user) {
                        user.premium_since = undefined;
                    },
                    error: new BBTagRuntimeError('User not boosting')
                }
            ]
        }),
        {
            code: '{userboostdate;{eval};{eval};{eval};{eval}}',
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

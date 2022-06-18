import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { UserBoostDateSubtag } from '@blargbot/bbtag/subtags/user/userboostdate';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserBoostDateSubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{userboostdate}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                ctx.members.command.premium_since = '2021-01-01T00:00:00+0000';
            }
        },
        ...createGetUserPropTestCases({
            quiet: '',
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
            quiet: '',
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
        })
    ]
});

import { BBTagRuntimeError, Subtag  } from '@blargbot/bbtag';
import { UserBoostDateSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserBoostDateSubtag),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{userboostdate}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                ctx.users.command.member.premium_since = '2021-01-01T00:00:00+0000';
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
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.premium_since = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: '`User not boosting`',
                    setup(user) {
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.premium_since = null;
                    },
                    error: new BBTagRuntimeError('User not boosting')
                },
                {
                    expected: '`User not boosting`',
                    setup(user) {
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.premium_since = undefined;
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
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.premium_since = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: '`User not boosting`',
                    setup(user) {
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.premium_since = null;
                    },
                    error: new BBTagRuntimeError('User not boosting')
                },
                {
                    expected: '`User not boosting`',
                    setup(user) {
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.premium_since = undefined;
                    },
                    error: new BBTagRuntimeError('User not boosting')
                }
            ]
        })
    ]
});

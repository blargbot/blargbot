import { UserJoinedAtSubtag } from '@cluster/subtags/user/userjoinedat';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserJoinedAtSubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{userjoinedat}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                ctx.members.command.joined_at = '2021-01-01T00:00:00+0000';
            }
        },
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['userjoinedat', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(user) {
                        user.joined_at = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: '2021-12-20T15:12:37+00:00',
                    setup(user) {
                        user.joined_at = '2021-12-20T15:12:37+00:00';
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['userjoinedat', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(user) {
                        user.joined_at = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: '20/12/2021',
                    setup(user) {
                        user.joined_at = '2021-12-20T15:12:37+00:00';
                    }
                }
            ]
        })
    ]
});

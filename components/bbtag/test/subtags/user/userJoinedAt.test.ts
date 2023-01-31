import { Subtag } from '@blargbot/bbtag';
import { UserJoinedAtSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserJoinedAtSubtag),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{userjoinedat}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                ctx.users.command.member.joined_at = '2021-01-01T00:00:00+0000';
            }
        },
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['userjoinedat', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(user) {
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.joined_at = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: '2021-12-20T15:12:37+00:00',
                    setup(user) {
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.joined_at = '2021-12-20T15:12:37+00:00';
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['userjoinedat', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(user) {
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.joined_at = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: '20/12/2021',
                    setup(user) {
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.joined_at = '2021-12-20T15:12:37+00:00';
                    }
                }
            ]
        })
    ]
});

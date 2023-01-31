import { Subtag } from '@blargbot/bbtag';
import { UserCreatedAtSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserCreatedAtSubtag),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{usercreatedat}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                ctx.users.command.id = '794354201395200000';
            }
        },
        {
            code: '{usercreatedat}',
            expected: '2021-12-18T16:42:33+00:00',
            setup(ctx) {
                ctx.users.command.id = '921804646018711552';
            }
        },
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['usercreatedat', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(member) {
                        member.id = '794354201395200000';
                    }
                },
                {
                    expected: '2021-12-18T16:42:33+00:00',
                    setup(member) {
                        member.id = '921804646018711552';
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['usercreatedat', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(member) {
                        member.id = '794354201395200000';
                    }
                },
                {
                    expected: '18/12/2021',
                    setup(member) {
                        member.id = '921804646018711552';
                    }
                }
            ]
        })
    ]
});

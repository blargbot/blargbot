import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserCreatedAtSubtag } from '@cluster/subtags/user/usercreatedat';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserCreatedAtSubtag(),
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
            generateCode(...args) {
                return `{${['usercreatedat', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(member) {
                        member.user.id = '794354201395200000';
                    }
                },
                {
                    expected: '2021-12-18T16:42:33+00:00',
                    setup(member) {
                        member.user.id = '921804646018711552';
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['usercreatedat', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(member) {
                        member.user.id = '794354201395200000';
                    }
                },
                {
                    expected: '18/12/2021',
                    setup(member) {
                        member.user.id = '921804646018711552';
                    }
                }
            ]
        }),
        {
            code: '{usercreatedat;{eval};{eval};{eval};{eval}}',
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

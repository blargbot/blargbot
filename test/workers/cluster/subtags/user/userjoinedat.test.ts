import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserJoinedAtSubtag } from '@cluster/subtags/user/userjoinedat';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserJoinedAtSubtag(),
    cases: [
        {
            code: '{userjoinedat}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                ctx.members.command.joined_at = '2021-01-01T00:00:00+0000';
            }
        },
        ...createGetUserPropTestCases({
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
        }),
        {
            code: '{userjoinedat;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 21, end: 27, error: new MarkerError('eval', 21) },
                { start: 28, end: 34, error: new MarkerError('eval', 28) },
                { start: 35, end: 41, error: new MarkerError('eval', 35) },
                { start: 0, end: 42, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});

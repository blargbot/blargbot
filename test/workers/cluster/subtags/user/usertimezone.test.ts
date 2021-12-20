import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserTimezoneSubtag } from '@cluster/subtags/user/usertimezone';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserTimezoneSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['usertimezone', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'UTC',
                    setup(member, ctx) {
                        ctx.userTable.setup(m => m.getSetting(member.user.id, 'timezone')).thenResolve(undefined);
                    }
                },
                {
                    expected: 'abc',
                    setup(member, ctx) {
                        ctx.userTable.setup(m => m.getSetting(member.user.id, 'timezone')).thenResolve('abc');
                    }
                },
                {
                    expected: 'Etc/UTC',
                    setup(member, ctx) {
                        ctx.userTable.setup(m => m.getSetting(member.user.id, 'timezone')).thenResolve('Etc/UTC');
                    }
                }
            ]
        }),
        {
            code: '{usertimezone;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 21, end: 27, error: new MarkerError('eval', 21) },
                { start: 28, end: 34, error: new MarkerError('eval', 28) },
                { start: 0, end: 35, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});

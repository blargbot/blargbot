import { NotEnoughArgumentsError, RoleNotFoundError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserHasRolesSubtag } from '@cluster/subtags/user/userhasroles';

import { MarkerError, runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserHasRolesSubtag(),
    cases: [
        {
            code: '{userhasroles}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 14, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{userhasroles;}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 15, error: new RoleNotFoundError('') }
            ]
        },
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasroles', '12345678901234567', ...args].join(';')}}`;
            },
            ifQuietAndNotFound: 'false',
            cases: [
                {
                    expected: 'true',
                    setup(user, ctx) {
                        const role = SubtagTestContext.createApiRole({ id: '12345678901234567' });
                        ctx.guild.roles.push(role);
                        user.roles.push(role.id);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasroles', '09876544321098765', ...args].join(';')}}`;
            },
            ifQuietAndNotFound: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(_, ctx) {
                        const role = SubtagTestContext.createApiRole({ id: '09876544321098765' });
                        ctx.guild.roles.push(role);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasroles', '["12345678901234567"]', ...args].join(';')}}`;
            },
            ifQuietAndNotFound: 'false',
            cases: [
                {
                    expected: 'true',
                    setup(user, ctx) {
                        const role = SubtagTestContext.createApiRole({ id: '12345678901234567' });
                        ctx.guild.roles.push(role);
                        user.roles.push(role.id);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasroles', '["09876544321098765"]', ...args].join(';')}}`;
            },
            ifQuietAndNotFound: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(_, ctx) {
                        const role = SubtagTestContext.createApiRole({ id: '09876544321098765' });
                        ctx.guild.roles.push(role);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasroles', '["123456788909876543","12345678901234567"]', ...args].join(';')}}`;
            },
            ifQuietAndNotFound: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(user, ctx) {
                        const role1 = SubtagTestContext.createApiRole({ id: '12345678901234567' });
                        const role2 = SubtagTestContext.createApiRole({ id: '123456788909876543' });
                        ctx.guild.roles.push(role1, role2);
                        user.roles.push(role1.id);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasroles', '["09876544321098765", "123456788909876543"]', ...args].join(';')}}`;
            },
            ifQuietAndNotFound: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(_, ctx) {
                        const role1 = SubtagTestContext.createApiRole({ id: '09876544321098765' });
                        const role2 = SubtagTestContext.createApiRole({ id: '123456788909876543' });
                        ctx.guild.roles.push(role1, role2);
                    }
                }
            ]
        }),
        {
            code: '{userhasroles;aaaaaa}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 21, error: new RoleNotFoundError('aaaaaa') }
            ]
        },
        {
            code: '{userhasroles;aaaaaa;;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 24, error: new RoleNotFoundError('aaaaaa').withDisplay('false') }
            ]
        },
        {
            code: '{userhasroles;{eval};{eval};{eval};{eval}}',
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

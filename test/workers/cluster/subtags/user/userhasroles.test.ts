import { RoleNotFoundError } from '@cluster/bbtag/errors';
import { UserHasRolesSubtag } from '@cluster/subtags/user/userhasroles';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserHasRolesSubtag(),
    argCountBounds: { min: 1, max: 3 },
    cases: [
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
        }
    ]
});

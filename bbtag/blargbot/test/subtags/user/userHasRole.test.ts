import { RoleNotFoundError } from '@bbtag/blargbot';
import { UserHasRoleSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: UserHasRoleSubtag,
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{userhasrole;}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 14, error: new RoleNotFoundError('') }
            ]
        },
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasrole', '12345678901234567', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'true',
                    setup(user, ctx) {
                        const role = SubtagTestContext.createRole({ id: '12345678901234567' });
                        ctx.guild.roles.push(role);
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.roles.push(role.id);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasrole', '09876544321098765', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(_, ctx) {
                        const role = SubtagTestContext.createRole({ id: '09876544321098765' });
                        ctx.guild.roles.push(role);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasrole', '["12345678901234567"]', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'true',
                    setup(user, ctx) {
                        const role = SubtagTestContext.createRole({ id: '12345678901234567' });
                        ctx.guild.roles.push(role);
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.roles.push(role.id);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasrole', '["09876544321098765"]', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(_, ctx) {
                        const role = SubtagTestContext.createRole({ id: '09876544321098765' });
                        ctx.guild.roles.push(role);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasrole', '["123456788909876543","12345678901234567"]', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'true',
                    setup(user, ctx) {
                        const role1 = SubtagTestContext.createRole({ id: '12345678901234567' });
                        const role2 = SubtagTestContext.createRole({ id: '123456788909876543' });
                        ctx.guild.roles.push(role1, role2);
                        if (user.member === undefined)
                            throw new Error('User isnt member of guild');
                        user.member.roles.push(role1.id);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userhasrole', '["09876544321098765", "123456788909876543"]', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(_, ctx) {
                        const role1 = SubtagTestContext.createRole({ id: '09876544321098765' });
                        const role2 = SubtagTestContext.createRole({ id: '123456788909876543' });
                        ctx.guild.roles.push(role1, role2);
                    }
                }
            ]
        }),
        {
            code: '{userhasrole;aaaaaa}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 20, error: new RoleNotFoundError('aaaaaa') }
            ]
        },
        {
            code: '{userhasrole;aaaaaa;;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 23, error: new RoleNotFoundError('aaaaaa').withDisplay('false') }
            ]
        }
    ]
});

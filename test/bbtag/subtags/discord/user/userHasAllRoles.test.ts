import type { GuildMemberHasRolesLocals } from '@blargbot/bbtag-engine';
import { replacers, RoleNotFoundError, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userHasAllRolesReplacer,
    names: ['userHasAllRoles', 'userHasRoles', 'hasAllRoles', 'hasRoles'],
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{userhasroles;}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 15, error: new RoleNotFoundError('') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves([]).mustHappen(1);
            }
        },
        ...createGetUserPropTestCases<GuildMemberHasRolesLocals>({
            generateCode(...args) {
                return `{${['userhasroles', '12345678901234567', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'true',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.listUserRoles(userId)).resolves([12345678901234567n]).mustHappen(1);
                        ctx.discord.setup(m => m.listAllRoles()).resolves([12345678901234567n, 938792874983234n]).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberHasRolesLocals>({
            generateCode(...args) {
                return `{${['userhasroles', '9876544321098765', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.listUserRoles(userId)).resolves([947853957387345n]).mustHappen(1);
                        ctx.discord.setup(m => m.listAllRoles()).resolves([9876544321098765n]).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberHasRolesLocals>({
            generateCode(...args) {
                return `{${['userhasroles', '["12345678901234567"]', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'true',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.listUserRoles(userId)).resolves([12345678901234567n]).mustHappen(1);
                        ctx.discord.setup(m => m.listAllRoles()).resolves([12345678901234567n, 938792874983234n]).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberHasRolesLocals>({
            generateCode(...args) {
                return `{${['userhasroles', '["9876544321098765"]', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.listUserRoles(userId)).resolves([947853957387345n]).mustHappen(1);
                        ctx.discord.setup(m => m.listAllRoles()).resolves([9876544321098765n]).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberHasRolesLocals>({
            generateCode(...args) {
                return `{${['userhasroles', '["123456788909876543","12345678901234567"]', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'true',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.listUserRoles(userId)).resolves([123456788909876543n, 12345678901234567n]).mustHappen(1);
                        ctx.discord.setup(m => m.listAllRoles()).resolves([123456788909876543n, 12345678901234567n]).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberHasRolesLocals>({
            generateCode(...args) {
                return `{${['userhasroles', '["123456788909876543","12345678901234567"]', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.listUserRoles(userId)).resolves([123456788909876543n]).mustHappen(1);
                        ctx.discord.setup(m => m.listAllRoles()).resolves([123456788909876543n, 12345678901234567n]).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberHasRolesLocals>({
            generateCode(...args) {
                return `{${['userhasroles', '["9876544321098765", "123456788909876543"]', ...args].join(';')}}`;
            },
            quiet: 'false',
            cases: [
                {
                    expected: 'false',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.listUserRoles(userId)).resolves([947853957387345n]).mustHappen(1);
                        ctx.discord.setup(m => m.listAllRoles()).resolves([123456788909876543n, 12345678901234567n, 9876544321098765n]).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{userhasroles;aaaaaa}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 21, error: new RoleNotFoundError('aaaaaa') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves([]).mustHappen(1);
            }
        },
        {
            code: '{userhasroles;aaaaaa;;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 24, error: new (RoleNotFoundError.withDisplay('false'))('aaaaaa') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: true, throw: UserNotFoundError.withDisplay('false') }))).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves([]).mustHappen(1);
            }
        }
    ]
});

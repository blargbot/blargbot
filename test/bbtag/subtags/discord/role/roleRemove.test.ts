import { BBTagRuntimeError, replacers, RoleNotFoundError, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';

const roles = [
    3298746326924n,
    9238476938485n,
    4384304833430n,
    ...Array.from({ length: 4 }, () => random.bigint(10n ** 10n, 10n ** 20n))
];

await runSubtagTests({
    replacer: replacers.roleRemoveReplacer,
    names: ['roleRemove', 'removeRole'],
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: `{roleremove;${roles[0]}}`,
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listUserRoles(userId)).resolves(roles.slice(0, 3)).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.discord.setup((m, $) => m.setUserRoles(userId, $.setEqual(roles.slice(1, 3)))).resolves(true).mustHappen(1);
            }
        },
        {
            code: `{roleremove;${roles[0]}}`,
            expected: 'false',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listUserRoles(userId)).resolves(roles.slice(1, 3)).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
            }
        },
        {
            code: `{roleremove;["${roles[0]}","${roles[4]}"]}`,
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listUserRoles(userId)).resolves(roles.slice(0, 3)).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.discord.setup((m, $) => m.setUserRoles(userId, $.setEqual(roles.slice(1, 3)))).resolves(true).mustHappen(1);
            }
        },
        {
            code: `{roleremove;["${roles[0]}",null]}`,
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listUserRoles(userId)).resolves(roles.slice(0, 3)).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.discord.setup((m, $) => m.setUserRoles(userId, $.setEqual(roles.slice(1, 3)))).resolves(true).mustHappen(1);
            }
        },
        {
            code: `{roleremove;${roles[0]}}`,
            expected: '`Author cannot remove roles`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Author cannot remove roles') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([]).mustHappen(1);
            }
        },
        {
            code: `{roleremove;${roles[0]}}`,
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves(roles.slice(1)).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listUserRoles(userId)).resolves(roles.slice(1, 3)).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
            }
        },
        {
            code: `{roleremove;${roles[0]}}`,
            expected: '`No role found`',
            errors: [
                { start: 0, end: 26, error: new RoleNotFoundError('3298746326924') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves(roles.slice(1)).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves(roles.slice(1)).mustHappen(1);
                ctx.discord.setup(m => m.listUserRoles(userId)).resolves(roles.slice(1, 3)).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
            }
        },
        {
            code: `{roleremove;${roles[0]};other user}`,
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listUserRoles(userId)).resolves(roles.slice(0, 3)).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ noLookup: false, throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.discord.setup((m, $) => m.setUserRoles(userId, $.setEqual(roles.slice(1, 3)))).resolves(true).mustHappen(1);
            }
        },
        {
            code: `{roleremove;${roles[0]};other user}`,
            expected: '`No user found`',
            errors: [
                { start: 0, end: 37, error: new UserNotFoundError('other user') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ noLookup: false, throw: UserNotFoundError })))
                    .rejects(new UserNotFoundError('other user'))
                    .mustHappen(1);
            }
        },
        {
            code: `{roleremove;${roles[0]};other user}`,
            expected: 'false',
            errors: [
                { start: 0, end: 37, error: new (UserNotFoundError.withDisplay('false'))('other user') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.quiet).returns(true);
                ctx.discord.setup(m => m.listManageableRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: UserNotFoundError.withDisplay('false') })))
                    .rejects(new (UserNotFoundError.withDisplay('false'))('other user'))
                    .mustHappen(1);
            }
        },
        {
            code: `{roleremove;${roles[0]};other user;q}`,
            expected: 'false',
            errors: [
                { start: 0, end: 39, error: new (UserNotFoundError.withDisplay('false'))('other user') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup(m => m.listAllRoles()).resolves(roles).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ noLookup: true, throw: UserNotFoundError.withDisplay('false') })))
                    .rejects(new (UserNotFoundError.withDisplay('false'))('other user'))
                    .mustHappen(1);
            }
        }
    ]
});

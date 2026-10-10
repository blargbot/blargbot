import type { GuildRoleSetPositionLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, FailedToEditRoleNoPermsError, NotANumberError, replacers, RoleNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleSetPositionReplacer,
    names: ['roleSetPosition', 'roleSetPos'],
    argCountBounds: { min: 2, max: 3 },
    setup(ctx) {
        ctx.discord.setup(m => m.listManageableRoles()).resolves([21028192812n], { isFallback: true });
    },
    cases: [
        ...createGetRolePropTestCases<GuildRoleSetPositionLocals>({
            quiet: true,
            generateCode(role, ...args) {
                return `{${['rolesetpos', role, '0', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(ctx, roleId) {
                        const topRole = random.bigint(10n ** 10n, 10n ** 20n);
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([topRole, roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.getRolePosition(topRole)).resolves(10).mustHappen(1);
                        ctx.discord.setup(m => m.setRolePosition(roleId, 0)).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases<GuildRoleSetPositionLocals>({
            quiet: true,
            generateCode(role, ...args) {
                return `{${['rolesetpos', role, '2', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(ctx, roleId) {
                        const topRole = random.bigint(10n ** 10n, 10n ** 20n);
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([topRole, roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.getRolePosition(topRole)).resolves(10).mustHappen(1);
                        ctx.discord.setup(m => m.setRolePosition(roleId, 2)).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([]).mustHappen(1);
            }
        },
        {
            code: '{rolesetpos;3298746326924;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 30, error: new NotANumberError('abc') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([239479234734n]).mustHappen(1);
            }
        },
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([239479234734n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: false, throw: RoleNotFoundError }))).resolves(2983749274n).mustHappen(1);
            }
        },
        {
            code: '{rolesetpos;3298746326924;12}',
            expected: '`Desired position above author`',
            errors: [
                { start: 0, end: 29, error: new BBTagRuntimeError('Desired position above author') }
            ],
            setup(ctx) {
                const roleId = random.bigint(10n ** 10n, 10n ** 20n);
                const topRole = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves([topRole, roleId]).mustHappen(1);
                ctx.discord.setup(m => m.getRolePosition(topRole)).resolves(10).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: false, throw: RoleNotFoundError }))).resolves(roleId).mustHappen(1);
            }
        },
        {
            code: '{rolesetpos;3298746326924;2}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new FailedToEditRoleNoPermsError() }
            ],
            setup(ctx) {
                const roleId = random.bigint(10n ** 10n, 10n ** 20n);
                const topRole = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves([topRole, roleId]).mustHappen(1);
                ctx.discord.setup(m => m.getRolePosition(topRole)).resolves(10).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: false, throw: RoleNotFoundError }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.setRolePosition(roleId, 2)).resolves(false).mustHappen(1);
            }
        },
        {
            code: '{rolesetpos;3298746326924;2;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 30, error: new (FailedToEditRoleNoPermsError.withDisplay('false'))() }
            ],
            setup(ctx) {
                const roleId = random.bigint(10n ** 10n, 10n ** 20n);
                const topRole = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves([topRole, roleId]).mustHappen(1);
                ctx.discord.setup(m => m.getRolePosition(topRole)).resolves(10).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: true, throw: RoleNotFoundError }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.setRolePosition(roleId, 2)).resolves(false).mustHappen(1);
            }
        }
    ]
});

import type { GuildRoleDeleteLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, FailedToDeleteRoleNoPermsError, replacers, RoleNotFoundError } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleDeleteReplacer,
    names: ['roleDelete'],
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases<GuildRoleDeleteLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['roledelete', ...args].join(';')}}`;
            },
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([239472937482n], { isFallback: true });
            },
            cases: [
                {
                    expected: '',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.deleteRole(roleId)).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{roledelete;3298746326924}',
            expected: '`Author cannot delete roles`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot delete roles') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([]).mustHappen(1);
            }
        },
        {
            code: '{roledelete;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                const roleId = randomSnowflake('roleId');
                ctx.discord.setup(m => m.listManageableRoles()).resolves([23984398724n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: false, throw: RoleNotFoundError }))).resolves(roleId).mustHappen(1);
            }
        },
        {
            code: '{roledelete;3298746326924}',
            expected: '`Failed to delete role: no perms`',
            errors: [
                { error: new FailedToDeleteRoleNoPermsError() }
            ],
            setup(ctx) {
                const roleId = randomSnowflake('roleId');
                ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: false, throw: RoleNotFoundError }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.deleteRole(roleId)).resolves(false).mustHappen(1);
            }
        },
        {
            code: '{roledelete;3298746326924;q}',
            expected: '',
            errors: [
                { error: new (FailedToDeleteRoleNoPermsError.withDisplay(''))() }
            ],
            setup(ctx) {
                const roleId = randomSnowflake('roleId');
                ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: true, throw: RoleNotFoundError.withQuiet(true, '') }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.deleteRole(roleId)).resolves(false).mustHappen(1);
            }
        }
    ]
});

import type { GuildRoleSetNameLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, FailedToEditRoleNoPermsError, replacers, RoleNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleSetNameReplacer,
    names: ['roleSetName'],
    argCountBounds: { min: 2, max: 3 },
    setup(ctx) {
        ctx.discord.setup(m => m.listManageableRoles()).resolves([21028192812n], { isFallback: true });
    },
    cases: [
        ...createGetRolePropTestCases<GuildRoleSetNameLocals>({
            quiet: true,
            generateCode(role, ...args) {
                return `{${['rolesetname', role, 'New name!', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.setRoleName(roleId, 'New name!')).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{rolesetname;3298746326924;New name!}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 37, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([]).mustHappen(1);
            }
        },
        {
            code: '{rolesetname;3298746326924;New name!}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 37, error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([239479234734n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: false, throw: RoleNotFoundError }))).resolves(2983749274n).mustHappen(1);
            }
        },
        {
            code: '{rolesetname;3298746326924;New name!}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 37, error: new FailedToEditRoleNoPermsError() }
            ],
            setup(ctx) {
                const roleId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: false, throw: RoleNotFoundError }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.setRoleName(roleId, 'New name!')).resolves(false).mustHappen(1);
            }
        },
        {
            code: '{rolesetname;3298746326924;New name!;q}',
            expected: '',
            errors: [
                { start: 0, end: 39, error: new (FailedToEditRoleNoPermsError.withDisplay(''))() }
            ],
            setup(ctx) {
                const roleId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: true, throw: RoleNotFoundError }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.setRoleName(roleId, 'New name!')).resolves(false).mustHappen(1);
            }
        }
    ]
});

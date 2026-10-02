import type { GuildRoleSetPermissionsLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, FailedToEditRoleNoPermsError, LegacyRoleNotFoundError, replacers } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleSetPermissionsReplacer,
    names: ['roleSetPermissions', 'roleSetPerms'],
    argCountBounds: { min: 1, max: 3 },
    setup(ctx) {
        ctx.discord.setup(m => m.listManageableRoles()).resolves([21028192812n], { isFallback: true });
    },
    cases: [
        ...createGetRolePropTestCases<GuildRoleSetPermissionsLocals>({
            quiet: false,
            generateCode(role, ...args) {
                return `{${['rolesetperms', role, '', ...args].join(';')}}`;
            },
            notFound: LegacyRoleNotFoundError,
            cases: [
                {
                    expected: '',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.setRolePermissions(roleId, 0n)).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases<GuildRoleSetPermissionsLocals>({
            quiet: true,
            generateCode(role, ...args) {
                return `{${['rolesetperms', role, '239748', ...args].join(';')}}`;
            },
            notFound: LegacyRoleNotFoundError,
            cases: [
                {
                    expected: '',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.setRolePermissions(roleId, 239748n)).resolves(true).mustHappen(1);
                    }
                }
                // TODO migrate this once setRolePermissions is implemented
                // {
                //     title: 'Author is admin',
                //     expected: '',
                //     setup(_, ctx) {
                //         ctx.roles.authorizer.permissions = eris.Constants.Permissions.administrator.toString();
                //     },
                //     postSetup(role, _, ctx) {
                //         ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, $.looksLike({ permissions: 239748n }), 'Command User#0000'))
                //             .thenResolve(role);
                //     }
                // },
                // {
                //     title: 'Author has permissions',
                //     expected: '',
                //     setup(_, ctx) {
                //         ctx.roles.authorizer.permissions = (eris.Constants.Permissions.all & ~eris.Constants.Permissions.administrator).toString();
                //     },
                //     postSetup(role, _, ctx) {
                //         ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, $.looksLike({ permissions: 239748n }), 'Command User#0000'))
                //             .thenResolve(role);
                //     }
                // },
                // {
                //     title: 'Author has partial permissions',
                //     expected: '',
                //     setup(_, ctx) {
                //         ctx.roles.authorizer.permissions = (
                //             eris.Constants.Permissions.manageRoles
                //             | eris.Constants.Permissions.viewAuditLog
                //             | eris.Constants.Permissions.readMessageHistory
                //         ).toString();
                //     },
                //     postSetup(role, _, ctx) {
                //         ctx.discord.setup(m => m.editRole(ctx.guild.id, role.id, $.looksLike({ permissions: 65664n }), 'Command User#0000'))
                //             .thenResolve(role);
                //     }
                // }
            ]
        }),
        {
            code: '{rolesetperms;3298746326924}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([]).mustHappen(1);
            }
        },
        {
            code: '{rolesetperms;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([239479234734n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ noLookup: false, throw: LegacyRoleNotFoundError }))).resolves(2983749274n).mustHappen(1);
            }
        },
        {
            code: '{rolesetperms;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new FailedToEditRoleNoPermsError() }
            ],
            setup(ctx) {
                const roleId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ noLookup: false, throw: LegacyRoleNotFoundError }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.setRolePermissions(roleId, 0n)).resolves(false).mustHappen(1);
            }
        }
    ]
});

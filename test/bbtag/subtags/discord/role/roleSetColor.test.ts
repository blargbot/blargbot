import type { GuildRoleSetColorLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, FailedToEditRoleNoPermsError, LegacyRoleNotFoundError, replacers } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleSetColorReplacerFactory({
        getColorByName(value) {
            switch (value) {
                case 'red': return 0xFF0000;
                case 'green': return 0x00FF00;
                case 'blue': return 0x0000FF;
                default: return null;
            }
        }
    }),
    names: ['roleSetColor'],
    argCountBounds: { min: 1, max: 3 },
    setup(ctx) {
        ctx.discord.setup(m => m.listManageableRoles()).resolves([-1n], { isFallback: true });
    },
    cases: [
        ...createGetRolePropTestCases<GuildRoleSetColorLocals>({
            quiet: true,
            generateCode(role, ...args) {
                return `{${['rolesetcolor', role, '', ...args].join(';')}}`;
            },
            notFound: LegacyRoleNotFoundError,
            cases: [
                {
                    expected: '',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.setRoleColor(roleId, 0)).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        ...[
            { text: '', color: 0x000000 },
            { text: 'this isnt a valid color', color: null },
            { text: 'red', color: 0xff0000 },
            { text: 'green', color: 0x00ff00 },
            { text: 'blue', color: 0x0000ff }
        ].flatMap(({ text, color }) => createGetRolePropTestCases<GuildRoleSetColorLocals>({
            quiet: true,
            generateCode(role, ...args) {
                return `{${['rolesetcolor', role, text, ...args].join(';')}}`;
            },
            notFound: LegacyRoleNotFoundError,
            cases: [
                {
                    expected: '',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.setRoleColor(roleId, color)).resolves(true).mustHappen(1);
                    }
                }
            ]
        })),
        {
            code: '{rolesetcolor;3298746326924}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([]).mustHappen(1);
            }
        },
        {
            code: '{rolesetcolor;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([239479234734n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: false, throw: LegacyRoleNotFoundError }))).resolves(2983749274n).mustHappen(1);
            }
        },
        {
            code: '{rolesetcolor;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 28, error: new FailedToEditRoleNoPermsError() }
            ],
            setup(ctx) {
                const roleId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: false, throw: LegacyRoleNotFoundError }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.setRoleColor(roleId, 0)).resolves(false).mustHappen(1);
            }
        },
        {
            code: '{rolesetcolor;3298746326924;;q}',
            expected: '',
            errors: [
                { start: 0, end: 31, error: new (FailedToEditRoleNoPermsError.withDisplay(''))() }
            ],
            setup(ctx) {
                const roleId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ quiet: true, throw: LegacyRoleNotFoundError }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.setRoleColor(roleId, 0)).resolves(false).mustHappen(1);
            }
        }
    ]
});

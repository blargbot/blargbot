import type { GuildRoleSetMentionableLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, FailedToEditRoleNoPermsError, LegacyRoleNotFoundError, replacers } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleSetMentionableReplacer,
    names: ['roleSetMentionable'],
    argCountBounds: { min: 1, max: 3 },
    setup(ctx) {
        ctx.discord.setup(m => m.listManageableRoles()).resolves([21028192812n], { isFallback: true });
    },
    cases: [
        ...createGetRolePropTestCases<GuildRoleSetMentionableLocals>({
            quiet: true,
            generateCode(role, ...args) {
                return `{${['rolesetmentionable', role, 'true', ...args].join(';')}}`;
            },
            notFound: LegacyRoleNotFoundError,
            cases: [
                {
                    expected: '',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.setRoleMentionable(roleId, true)).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases<GuildRoleSetMentionableLocals>({
            quiet: true,
            generateCode(role, ...args) {
                return `{${['rolesetmentionable', role, 'false', ...args].join(';')}}`;
            },
            notFound: LegacyRoleNotFoundError,
            cases: [
                {
                    expected: '',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.setRoleMentionable(roleId, false)).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases<GuildRoleSetMentionableLocals>({
            quiet: true,
            generateCode(role, ...args) {
                return `{${['rolesetmentionable', role, '', ...args].join(';')}}`;
            },
            notFound: LegacyRoleNotFoundError,
            cases: [
                {
                    expected: '',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.setRoleMentionable(roleId, true)).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases<GuildRoleSetMentionableLocals>({
            quiet: true,
            generateCode(role, ...args) {
                return `{${['rolesetmentionable', role, 'abc', ...args].join(';')}}`;
            },
            notFound: LegacyRoleNotFoundError,
            cases: [
                {
                    expected: '',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                        ctx.discord.setup(m => m.setRoleMentionable(roleId, false)).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Author cannot edit roles`',
            errors: [
                { start: 0, end: 34, error: new BBTagRuntimeError('Author cannot edit roles') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([]).mustHappen(1);
            }
        },
        {
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { start: 0, end: 34, error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                ctx.discord.setup(m => m.listManageableRoles()).resolves([239479234734n]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ noLookup: false, throw: LegacyRoleNotFoundError }))).resolves(2983749274n).mustHappen(1);
            }
        },
        {
            code: '{rolesetmentionable;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            errors: [
                { start: 0, end: 34, error: new FailedToEditRoleNoPermsError() }
            ],
            setup(ctx) {
                const roleId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup(m => m.listManageableRoles()).resolves([roleId]).mustHappen(1);
                ctx.discord.setup((m, $) => m.queryRole('3298746326924', $({ noLookup: false, throw: LegacyRoleNotFoundError }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.setRoleMentionable(roleId, true)).resolves(false).mustHappen(1);
            }
        }
    ]
});

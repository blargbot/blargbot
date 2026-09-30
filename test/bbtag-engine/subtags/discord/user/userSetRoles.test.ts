import type { GuildMemberRolesLocals, GuildRolesLocals, VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, NotAnArrayError, replacers, RoleNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userSetRolesReplacer,
    names: ['userSetRoles', 'setRoles'],
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{usersetroles}',
            expected: 'true',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup(m => m.getAssignableRoles()).resolves([2937192378371n]).mustHappen(1);
                ctx.locals.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.locals.setup((m, $) => m.setGuildMemberRoles(userId, $.setEqual([]))).resolves(true).mustHappen(1);
            }
        },
        ...createGetUserPropTestCases<GuildMemberRolesLocals & GuildRolesLocals & VariablesLocals>({
            quiet: 'false',
            generateCode(...args) {
                return `{${['usersetroles', '[]', ...args].join(';')}}`;
            },
            setup(ctx) {
                ctx.locals.setup(m => m.getAssignableRoles()).resolves([2937192378371n]).mustHappen(1);
            },
            cases: [
                {
                    expected: 'true',
                    setup(ctx, userId) {
                        ctx.locals.setup((m, $) => m.setGuildMemberRoles(userId, $.setEqual([]))).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberRolesLocals & GuildRolesLocals & VariablesLocals>({
            quiet: 'false',
            generateCode(...args) {
                return `{${['usersetroles', '["r1","r2"]', ...args].join(';')}}`;
            },
            setup(ctx) {
                ctx.locals.setup(m => m.getAssignableRoles()).resolves([2937192378371n]).mustHappen(1);
            },
            cases: [
                {
                    expected: 'true',
                    setup(ctx, userId, quiet) {
                        ctx.locals.setup((m, $) => m.queryRole('r1', $({ noLookup: quiet, throw: !quiet || 'false' }))).resolves(283674284762348926n).mustHappen(1);
                        ctx.locals.setup((m, $) => m.queryRole('r2', $({ noLookup: quiet, throw: !quiet || 'false' }))).resolves(234967249876489624n).mustHappen(1);
                        ctx.locals.setup((m, $) => m.setGuildMemberRoles(userId, $.setEqual([283674284762348926n, 234967249876489624n]))).resolves(true).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{usersetroles}',
            expected: '`Author cannot remove roles`',
            errors: [
                { start: 0, end: 14, error: new BBTagRuntimeError('Author cannot remove roles') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.getAssignableRoles()).resolves([]).mustHappen(1);
            }
        },
        {
            code: '{usersetroles;abc}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 18, error: new NotAnArrayError('abc') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.getAssignableRoles()).resolves([2937192378371n]).mustHappen(1);
                ctx.locals.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen(1);
                variables.setup(m => m.get('abc')).resolves({ key: '$abc', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{usersetroles;abc;;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 21, error: new NotAnArrayError('abc').withDisplay('false') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.getAssignableRoles()).resolves([2937192378371n]).mustHappen(1);
                ctx.locals.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen(1);
                variables.setup(m => m.get('abc')).resolves({ key: '$abc', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{usersetroles;["unknown role"]}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 31, error: new RoleNotFoundError('unknown role') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup(m => m.getAssignableRoles()).resolves([2937192378371n]).mustHappen(1);
                ctx.locals.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.locals.setup((m, $) => m.queryRole('unknown role', $({ noLookup: false, throw: true }))).rejects(new RoleNotFoundError('unknown role')).mustHappen(1);
            }
        },
        {
            code: '{usersetroles;["unknown role"];;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 34, error: new RoleNotFoundError('unknown role').withDisplay('false') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup(m => m.getAssignableRoles()).resolves([2937192378371n]).mustHappen(1);
                ctx.locals.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.locals.setup((m, $) => m.queryRole('unknown role', $({ noLookup: true, throw: 'false' })))
                    .rejects(new RoleNotFoundError('unknown role').withDisplay('false'))
                    .mustHappen(1);
            }
        }
    ]
});

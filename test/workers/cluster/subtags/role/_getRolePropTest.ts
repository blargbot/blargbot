import { BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, RoleNotFoundError } from '@cluster/bbtag/errors';
import { APIRole } from 'discord-api-types';
import { Guild, Role } from 'eris';

import { argument } from '../../../../mock';
import { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite';

export function createGetRolePropTestCases(options: GetRolePropTestData): SubtagTestCase[] {
    return [...createGetRolePropTestCasesIter(options)];
}

function* createGetRolePropTestCasesIter(options: GetRolePropTestData): Generator<SubtagTestCase, void, undefined> {
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command']));

    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', 'q']));
    }

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'other role']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'other role', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'other role', 'q']));
    }

    const notFound = options.notFound ?? (r => new RoleNotFoundError(r));

    yield {
        code: options.generateCode('unknown role'),
        expected: `\`${notFound('unknown role').message}\``,
        errors: [
            { start: 0, end: options.generateCode('unknown role').length, error: notFound('unknown role') }
        ],
        setup(ctx) {
            ctx.util.setup(m => m.findRoles(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'unknown role'))
                .verifiable(1)
                .thenResolve([]);
        }
    };

    if (options.quiet !== false) {
        yield {
            code: options.generateCode('unknown role', ''),
            expected: `\`${notFound('unknown role').message}\``,
            errors: [
                { start: 0, end: options.generateCode('unknown role', '').length, error: notFound('unknown role') }
            ],
            setup(ctx) {
                ctx.util.setup(m => m.findRoles(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'unknown role'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        };
        yield {
            code: options.generateCode('unknown role', 'q'),
            expected: options.quiet ?? `\`${notFound('unknown role').message}\``,
            errors: [
                { start: 0, end: options.generateCode('unknown role', 'q').length, error: notFound('unknown role').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                ctx.util.setup(m => m.findRoles(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'unknown role'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        };
    }
}

interface GetRolePropTestData {
    cases: GetRolePropTestCase[];
    quiet?: string | false;
    generateCode: (...args: [roleStr?: string, quietStr?: string]) => string;
    notFound?: (roleStr: string) => BBTagRuntimeError;
}

interface GetRolePropTestCase {
    title?: string;
    expected: string;
    error?: BBTagRuntimeError;
    queryString?: string;
    generateCode?: (...args: [roleStr?: string, quietStr?: string]) => string;
    setup?: (role: APIRole, context: SubtagTestContext) => void;
    postSetup?: (role: Role, context: BBTagContext, test: SubtagTestContext) => void;
    assert?: (result: string, role: Role, context: BBTagContext, test: SubtagTestContext) => void;
}

function createTestCase(data: GetRolePropTestData, testCase: GetRolePropTestCase, roleKey: keyof SubtagTestContext['roles'], args: Parameters<GetRolePropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    return {
        code,
        title: testCase.title,
        expected: testCase.expected,
        errors: testCase.error === undefined ? [] : [{ start: 0, end: code.length, error: testCase.error }],
        setup(ctx) {
            testCase.setup?.(ctx.roles[roleKey], ctx);
        },
        postSetup(bbctx, ctx) {
            const role = bbctx.guild.roles.get(ctx.roles[roleKey].id);
            if (role === undefined)
                throw new Error('Cannot find the role under test');
            if (args[0] !== undefined && args[0] !== '') {
                ctx.util.setup(m => m.findRoles(role.guild, args[0]))
                    .thenResolve([role]);
            }

            testCase.postSetup?.(role, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            if (testCase.assert === undefined)
                return;
            const role = bbctx.guild.roles.get(ctx.roles[roleKey].id);
            if (role === undefined)
                throw new Error('Cannot find the role under test');
            testCase.assert(result, role, bbctx, ctx);
        }
    };
}

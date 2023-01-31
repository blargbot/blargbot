import type { BBTagContext, BBTagRuntimeError, Entities, FindEntityOptions  } from '@blargbot/bbtag';
import { RoleNotFoundError } from '@blargbot/bbtag';
import { argument } from '@blargbot/test-util/mock.js';

import type { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetRolePropTestCases(options: GetRolePropTestData): SubtagTestCase[] {
    if (options.quiet !== false)
        options.getQueryOptions ??= q => ({ noLookup: q });
    return [...createGetRolePropTestCasesIter(options)];
}

function* createGetRolePropTestCasesIter(options: GetRolePropTestData): Generator<SubtagTestCase, void, undefined> {
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['command']));

    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['command', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, true, c, 'command', ['command', 'q']));
    }

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'other', [c.queryString ?? 'other role']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'other', [c.queryString ?? 'other role', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, true, c, 'other', [c.queryString ?? 'other role', 'q']));
    }

    const notFound = options.notFound ?? (r => new RoleNotFoundError(r));

    yield {
        code: options.generateCode('unknown role'),
        expected: `\`${notFound('unknown role').message}\``,
        errors: [
            { start: 0, end: options.generateCode('unknown role').length, error: notFound('unknown role') }
        ],
        postSetup(bbctx, ctx) {
            ctx.roleService.setup(m => m.querySingle(bbctx, 'unknown role', argument.isDeepEqual(options.getQueryOptions?.(false)))).thenResolve(undefined);
        }
    };

    if (options.quiet !== false) {
        yield {
            code: options.generateCode('unknown role', ''),
            expected: `\`${notFound('unknown role').message}\``,
            errors: [
                { start: 0, end: options.generateCode('unknown role', '').length, error: notFound('unknown role') }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, 'unknown role', argument.isDeepEqual(options.getQueryOptions?.(false)))).thenResolve(undefined);
            }
        };
        yield {
            code: options.generateCode('unknown role', 'q'),
            expected: options.quiet ?? `\`${notFound('unknown role').message}\``,
            errors: [
                { start: 0, end: options.generateCode('unknown role', 'q').length, error: notFound('unknown role').withDisplay(options.quiet) }
            ],
            postSetup(bbctx, ctx) {
                ctx.roleService.setup(m => m.querySingle(bbctx, 'unknown role', argument.isDeepEqual(options.getQueryOptions?.(true)))).thenResolve(undefined);
            }
        };
    }
}

interface GetRolePropTestData {
    cases: GetRolePropTestCase[];
    quiet?: string | false;
    getQueryOptions?: (quiet: boolean) => FindEntityOptions;
    generateCode: (...args: [roleStr?: string, quietStr?: string]) => string;
    notFound?: (roleStr: string) => BBTagRuntimeError;
}

interface GetRolePropTestCase {
    title?: string;
    expected: string;
    error?: BBTagRuntimeError;
    queryString?: string;
    generateCode?: (...args: [roleStr?: string, quietStr?: string]) => string;
    setup?: (role: Entities.Role, context: SubtagTestContext) => void;
    postSetup?: (role: Entities.Role, context: BBTagContext, test: SubtagTestContext) => void;
    assert?: (result: string, role: Entities.Role, context: BBTagContext, test: SubtagTestContext) => void;
}

function createTestCase(data: GetRolePropTestData, isQuiet: boolean, testCase: GetRolePropTestCase, roleKey: keyof SubtagTestContext['roles'], args: Parameters<GetRolePropTestData['generateCode']>): SubtagTestCase {
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
            const role = ctx.roles[roleKey];
            if (args[0] !== undefined && args[0] !== '') {
                ctx.roleService.setup(m => m.querySingle(bbctx, args[0] as string, argument.isDeepEqual(data.getQueryOptions?.(isQuiet))), false).thenResolve(role);
            }

            testCase.postSetup?.(role, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            if (testCase.assert === undefined)
                return;
            const role = ctx.roles[roleKey];
            testCase.assert(result, role, bbctx, ctx);
        }
    };
}
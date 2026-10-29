import type { BBTagRuntimeError, QueryEntityOptions } from '@blargbot/bbtag';
import { RoleNotFoundError } from '@blargbot/bbtag';
import { RoleIdSubtag } from '@blargbot/bbtag/subtags';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, type SubtagTestCase, type SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetRolePropTestCases(options: GetRolePropTestData): SubtagTestCase[] {
    return [...createGetRolePropTestCasesIter(options)];
}

function* createGetRolePropTestCasesIter(options: GetRolePropTestData): Generator<SubtagTestCase, void, undefined> {
    if (options.includeNoArgs === true)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, []));

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['command']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['command', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['command', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, [c.queryString ?? 'general']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, [c.queryString ?? 'general', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, [c.queryString ?? 'general', 'q']));
    }

    const notFound = options.notFound ?? (c => new RoleNotFoundError(c));
    const roleIdSubtag = createMockSubtag(RoleIdSubtag);

    yield {
        title: 'Role not found',
        code: options.generateCode('123456789987654329'),
        expected: `\`${notFound('123456789987654329').message}\``,
        subtags: [roleIdSubtag.instance],
        errors: [
            { error: notFound('123456789987654329') }
        ],
        setup(ctx) {
            options.setup?.(ctx, false);
            ctx.adoptMock(roleIdSubtag);
            const queryOptions = options.queryOptions(false);
            roleIdSubtag.setup((m, $) => m.query(ctx.bbtag, '123456789987654329', $(queryOptions))).resolves(undefined);
        }
    };
    if (options.quiet !== false) {
        yield {
            title: 'Role not found but quiet',
            code: options.generateCode('123456789987654329', 'q'),
            expected: options.quiet ?? `\`${notFound('123456789987654329').message}\``,
            subtags: [roleIdSubtag.instance],
            errors: [
                { error: notFound('123456789987654329').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                options.setup?.(ctx, true);
                ctx.adoptMock(roleIdSubtag);
                const queryOptions = options.queryOptions(true);
                roleIdSubtag.setup((m, $) => m.query(ctx.bbtag, '123456789987654329', $(queryOptions))).resolves(undefined);
            }
        };
    }
}

export interface GetRolePropTestData {
    cases: GetRolePropTestCase[];
    includeNoArgs?: boolean;
    quiet?: string | false;
    queryOptions: (quiet: boolean) => QueryEntityOptions | undefined;
    generateCode: (...args: [roleStr?: string, quietStr?: string]) => string;
    notFound?: (roleStr: string) => BBTagRuntimeError;
    setup?: (context: SubtagTestContext, quiet: boolean) => void;
}

export interface GetRolePropTestCase {
    title?: string;
    expected: string | RegExp;
    error?: BBTagRuntimeError;
    retries?: number;
    queryString?: string;
    generateCode?: (...args: [roleStr?: string, quietStr?: string]) => string;
    setup?: (roleId: string, context: SubtagTestContext, quiet: boolean) => void;
    assert?: (result: string, roleId: string, context: SubtagTestContext) => void;
}

function createTestCase(data: GetRolePropTestData, testCase: GetRolePropTestCase, args: Parameters<GetRolePropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    const roleIdSubtag = createMockSubtag(RoleIdSubtag);
    const [roleQuery, quietStr = ''] = args;
    const roleId = `roleId${createSnowflake()}`;
    return {
        title: testCase.title,
        code,
        expected: () => testCase.expected,
        retries: testCase.retries,
        subtags: [roleIdSubtag.instance],
        errors: testCase.error === undefined ? [] : [{ error: testCase.error }],
        setup(ctx) {
            data.setup?.(ctx, quietStr !== '');
            testCase.setup?.(roleId, ctx, quietStr !== '');
            ctx.adoptMock(roleIdSubtag);

            if (roleQuery !== undefined) {
                const queryOptions = data.queryOptions(quietStr !== '');
                roleIdSubtag.setup((m, $) => m.query(ctx.bbtag, roleQuery, $(queryOptions))).resolves(roleId);
            }
        },
        assert(ctx, result) {
            testCase.assert?.(result, roleId, ctx);
        }
    };
}

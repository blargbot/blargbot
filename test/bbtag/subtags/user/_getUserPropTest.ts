import type { BBTagRuntimeError, QueryEntityOptions } from '@blargbot/bbtag-engine';
import { UserNotFoundError } from '@blargbot/bbtag-engine';
import { UserIdSubtag } from '@blargbot/bbtag-engine/subtags';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, type SubtagTestCase, type SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetUserPropTestCases(options: GetUserPropTestData): SubtagTestCase[] {
    return [...createGetUserPropTestCasesIter(options)];
}

function* createGetUserPropTestCasesIter(options: GetUserPropTestData): Generator<SubtagTestCase, void, undefined> {
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

    const notFound = options.notFound ?? (c => new UserNotFoundError(c));
    const userIdSubtag = createMockSubtag(UserIdSubtag);

    yield {
        title: 'User not found',
        code: options.generateCode('123456789987654329'),
        expected: `\`${notFound('123456789987654329').message}\``,
        subtags: [userIdSubtag.instance],
        errors: [
            { error: notFound('123456789987654329') }
        ],
        setup(ctx) {
            options.setup?.(ctx, false);
            ctx.adoptMock(userIdSubtag);
            const queryOptions = options.queryOptions(false);
            userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '123456789987654329', $(queryOptions))).resolves(undefined);
        }
    };
    if (options.quiet !== false) {
        yield {
            title: 'User not found but quiet',
            code: options.generateCode('123456789987654329', 'q'),
            expected: options.quiet ?? `\`${notFound('123456789987654329').message}\``,
            subtags: [userIdSubtag.instance],
            errors: [
                { error: notFound('123456789987654329').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                options.setup?.(ctx, true);
                ctx.adoptMock(userIdSubtag);
                const queryOptions = options.queryOptions(true);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '123456789987654329', $(queryOptions))).resolves(undefined);
            }
        };
    }
}

export interface GetUserPropTestData {
    cases: GetUserPropTestCase[];
    includeNoArgs?: boolean;
    quiet?: string | false;
    queryOptions: (quiet: boolean) => QueryEntityOptions | undefined;
    generateCode: (...args: [userStr?: string, quietStr?: string]) => string;
    notFound?: (userStr: string) => BBTagRuntimeError;
    setup?: (context: SubtagTestContext, quiet: boolean) => void;
}

export interface GetUserPropTestCase {
    title?: string;
    expected: string | RegExp;
    error?: BBTagRuntimeError;
    retries?: number;
    queryString?: string;
    generateCode?: (...args: [userStr?: string, quietStr?: string]) => string;
    setup?: (userId: string, context: SubtagTestContext, quiet: boolean) => void;
    assert?: (result: string, userId: string, context: SubtagTestContext) => void;
}

function createTestCase(data: GetUserPropTestData, testCase: GetUserPropTestCase, args: Parameters<GetUserPropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    const userIdSubtag = createMockSubtag(UserIdSubtag);
    const [userQuery, quietStr = ''] = args;
    const userId = `userId<${createSnowflake()}>`;
    return {
        title: testCase.title,
        code,
        expected: () => testCase.expected,
        retries: testCase.retries,
        subtags: [userIdSubtag.instance],
        errors: testCase.error === undefined ? [] : [{ error: testCase.error }],
        setup(ctx) {
            ctx.adoptMock(userIdSubtag);
            data.setup?.(ctx, quietStr !== '');
            testCase.setup?.(userId, ctx, quietStr !== '');
            if (userQuery !== undefined) {
                const queryOptions = data.queryOptions(quietStr !== '');
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, userQuery, $(queryOptions))).resolves(userId);
            }
        },
        assert(ctx, result) {
            testCase.assert?.(result, userId, ctx);
        }
    };
}

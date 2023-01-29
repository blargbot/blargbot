import type { BBTagContext, Entities, FindEntityOptions } from '@blargbot/bbtag';
import type { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { UserNotFoundError } from '@blargbot/bbtag/errors/index.js';
import { argument } from '@blargbot/test-util/mock.js';

import type { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetUserPropTestCases(options: GetUserPropTestData): SubtagTestCase[] {
    if (options.quiet !== false)
        options.getQueryOptions ??= q => ({ noLookup: q });
    return [...createGetUserPropTestCasesIter(options)];
}

export function* createGetUserPropTestCasesIter(options: GetUserPropTestData): Generator<SubtagTestCase, void, undefined> {
    if (options.includeNoArgs !== false)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', []));

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, true, c, 'command', ['', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'other', [c.queryString ?? 'other user']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'other', [c.queryString ?? 'other user', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, true, c, 'other', [c.queryString ?? 'other user', 'q']));
    }
    yield {
        code: options.generateCode('unknown user'),
        expected: '`No user found`',
        errors: [
            { start: 0, end: options.generateCode('unknown user').length, error: new UserNotFoundError('unknown user') }
        ],
        postSetup(bbctx, ctx) {
            ctx.userService.setup(m => m.querySingle(bbctx, 'unknown user', argument.isDeepEqual(options.getQueryOptions?.(false))), false).thenResolve(undefined);
        }
    };
    if (options.quiet !== false) {
        yield {
            code: options.generateCode('unknown user', ''),
            expected: '`No user found`',
            errors: [
                { start: 0, end: options.generateCode('unknown user', '').length, error: new UserNotFoundError('unknown user') }
            ],
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.querySingle(bbctx, 'unknown user', argument.isDeepEqual(options.getQueryOptions?.(false))), false).thenResolve(undefined);
            }
        };
        yield {
            code: options.generateCode('unknown user', 'q'),
            expected: options.quiet ?? '`No user found`',
            errors: [
                { start: 0, end: options.generateCode('unknown user', 'q').length, error: new UserNotFoundError('unknown user').withDisplay(options.quiet) }
            ],
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.querySingle(bbctx, 'unknown user', argument.isDeepEqual(options.getQueryOptions?.(true))), false).thenResolve(undefined);
            }
        };
    }
}

interface GetUserPropTestData {
    cases: GetUserPropTestCase[];
    quiet?: string | false;
    includeNoArgs?: boolean;
    getQueryOptions?: (quiet: boolean) => FindEntityOptions;
    generateCode: (...args: [userStr?: string, quietStr?: string]) => string;
}

interface GetUserPropTestCase {
    expected: string;
    error?: BBTagRuntimeError;
    queryString?: string;
    generateCode?: (...args: [userStr?: string, quietStr?: string]) => string;
    setup?: (member: Entities.User, context: SubtagTestContext, quiet: boolean) => void;
    postSetup?: (member: Entities.User, context: BBTagContext, test: SubtagTestContext, quiet: boolean) => void;
    assert?: (result: string, member: Entities.User, context: BBTagContext, test: SubtagTestContext, quiet: boolean) => void;
}

function createTestCase(data: GetUserPropTestData, isQuiet: boolean, testCase: GetUserPropTestCase, memberKey: keyof SubtagTestContext['users'], args: Parameters<GetUserPropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    return {
        code,
        expected: testCase.expected,
        errors: testCase.error === undefined ? [] : [{ start: 0, end: code.length, error: testCase.error }],
        setup(ctx) {
            testCase.setup?.(ctx.users[memberKey], ctx, isQuiet);
        },
        postSetup(bbctx, ctx) {
            const member = ctx.users[memberKey];
            if (args[0] !== undefined && args[0] !== '') {
                ctx.userService.setup(m => m.querySingle(bbctx, args[0] as string, argument.isDeepEqual(data.getQueryOptions?.(isQuiet))), false).thenResolve(member);
            }

            testCase.postSetup?.(member, bbctx, ctx, isQuiet);
        },
        assert(bbctx, result, ctx) {
            if (testCase.assert === undefined)
                return;
            const member = ctx.users[memberKey];
            testCase.assert(result, member, bbctx, ctx, isQuiet);
        }
    };
}

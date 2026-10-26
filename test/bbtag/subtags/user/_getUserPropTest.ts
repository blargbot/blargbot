import type { BBTagContext, BBTagRuntimeError, QueryEntityOptions } from '@blargbot/bbtag';
import { UserNotFoundError } from '@blargbot/bbtag';
import { UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import type { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetUserPropTestCases(options: GetUserPropTestData): SubtagTestCase[] {
    return [...createGetUserPropTestCasesIter(options)];
}

function* createGetUserPropTestCasesIter(options: GetUserPropTestData): Generator<SubtagTestCase, void, undefined> {
    if (options.includeNoArgs === true)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', []));

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'general']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'general', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'other', [c.queryString ?? 'general', 'q']));
    }

    const notFound = options.notFound ?? (c => new UserNotFoundError(c));
    const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

    yield {
        title: 'User not found',
        code: options.generateCode('12345678998765432'),
        expected: `\`${notFound('12345678998765432').message}\``,
        subtags: [userIdSubtag.instance],
        errors: [
            { error: notFound('12345678998765432') }
        ],
        setup(ctx) {
            options.setup?.(ctx);
            ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
        },
        postSetup(bbctx) {
            const queryOptions = options.queryOptions(false);
            userIdSubtag.setup((m, $) => m.query(bbctx, '12345678998765432', $(queryOptions))).resolves(undefined);
        }
    };
    if (options.quiet !== false) {
        yield {
            title: 'User not found but quiet',
            code: options.generateCode('12345678998765432', 'q'),
            expected: options.quiet ?? `\`${notFound('12345678998765432').message}\``,
            subtags: [userIdSubtag.instance],
            errors: [
                { error: notFound('12345678998765432').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                options.setup?.(ctx);
                ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
            },
            postSetup(bbctx) {
                const queryOptions = options.queryOptions(true);
                userIdSubtag.setup((m, $) => m.query(bbctx, '12345678998765432', $(queryOptions))).resolves(undefined);
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
    setup?: (context: SubtagTestContext) => void;
}

export interface GetUserPropTestCase {
    title?: string;
    expected: string | RegExp;
    userId?: string;
    error?: BBTagRuntimeError;
    retries?: number;
    queryString?: string;
    generateCode?: (...args: [userStr?: string, quietStr?: string]) => string;
    setup?: (userId: string, context: SubtagTestContext) => void;
    postSetup?: (userId: string, context: BBTagContext, test: SubtagTestContext) => void;
    assert?: (result: string, userId: string, context: BBTagContext, test: SubtagTestContext) => void;
}

function createTestCase(data: GetUserPropTestData, testCase: GetUserPropTestCase, userKey: keyof SubtagTestContext['users'], args: Parameters<GetUserPropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });
    return {
        title: testCase.title,
        code,
        expected: () => testCase.expected,
        retries: testCase.retries,
        subtags: [userIdSubtag.instance],
        errors: testCase.error === undefined ? [] : [{ error: testCase.error }],
        setup(ctx) {
            data.setup?.(ctx);
            const isMessageUser = ctx.users[userKey].id === ctx.message.author.id;
            const user = ctx.users[userKey];
            if (testCase.userId !== undefined)
                user.id = testCase.userId;
            testCase.setup?.(user.id, ctx);
            if (isMessageUser)
                ctx.message.author.id = user.id;
            ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });

        },
        postSetup(bbctx, ctx) {
            const [userQuery, quietStr = ''] = args;
            if (userQuery !== undefined) {
                const queryOptions = data.queryOptions(quietStr !== '');
                userIdSubtag.setup((m, $) => m.query(bbctx, userQuery, $(queryOptions))).resolves(ctx.users[userKey].id);
            }
            testCase.postSetup?.(ctx.users[userKey].id, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            testCase.assert?.(result, ctx.users[userKey].id, bbctx, ctx);
        }
    };
}

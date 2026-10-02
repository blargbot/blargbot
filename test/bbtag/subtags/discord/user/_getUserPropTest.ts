import type { BBTagRuntimeError, QueryDiscordUserLocals } from '@blargbot/bbtag-engine';
import { UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import type { SubtagTestCase, SubtagTestContext } from '../../SubtagTestSuite.js';

export function createGetUserPropTestCases<Locals extends QueryDiscordUserLocals>(options: GetUserPropTestData<Locals>): Array<SubtagTestCase<Locals>> {
    return [...createGetUserPropTestCasesIter(options)];
}

export function* createGetUserPropTestCasesIter<Locals extends QueryDiscordUserLocals>(options: GetUserPropTestData<Locals>): Generator<SubtagTestCase<Locals>, void, undefined> {
    const seenCases = new Set<string>();
    for (const testCase of options.cases) {
        const code = (testCase.generateCode ?? options.generateCode)('userStr', 'quietStr');
        const key = `${code}|${testCase.expected}|${testCase.title ?? ''}`;
        if (seenCases.has(key))
            throw new Error(`Duplicate test case: ${JSON.stringify({ code, expected: testCase.expected, title: testCase.title })}`);
        seenCases.add(key);
    }
    seenCases.clear();
    function isUniqueCode(testCase: SubtagTestCase<Locals>): boolean {
        const key = `${testCase.code}|${typeof testCase.expected === 'function' ? testCase.expected() : String(testCase.expected)}|${testCase.title ?? ''}`;
        if (seenCases.has(key))
            return false;
        seenCases.add(key);
        return true;
    }
    if (options.includeNoArgs !== false)
        yield* options.cases.map(c => createTestCase(options, c, [])).filter(isUniqueCode);

    yield* options.cases.map(c => createTestCase(options, c, [''])).filter(isUniqueCode);
    if (options.quiet !== undefined) {
        yield* options.cases.map(c => createTestCase(options, c, ['', ''])).filter(isUniqueCode);
        yield* options.cases.map(c => createTestCase(options, c, ['', 'q'])).filter(isUniqueCode);
    }
    yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'other user'])).filter(isUniqueCode);
    if (options.quiet !== undefined) {
        yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'other user', ''])).filter(isUniqueCode);
        yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'other user', 'q'])).filter(isUniqueCode);
    }
    yield* unknownUserCases(options).filter(isUniqueCode);
}

function* unknownUserCases<Locals extends QueryDiscordUserLocals>(options: GetUserPropTestData<Locals>): Generator<SubtagTestCase<Locals>, void, undefined> {
    yield {
        code: options.generateCode('unknown user'),
        expected: '`No user found`',
        errors: [
            { start: 0, end: options.generateCode('unknown user').length, error: new UserNotFoundError('unknown user') }
        ],
        setup(ctx) {
            options.setup?.(ctx);
            ctx.discord.setup((m, $) => m.queryUser('unknown user', $({ noLookup: false, throw: UserNotFoundError })))
                .rejects(new UserNotFoundError('unknown user'))
                .mustHappen(1);
        }
    };
    if (options.quiet !== undefined) {
        const quiet = options.quiet;
        yield {
            code: options.generateCode('unknown user', ''),
            expected: '`No user found`',
            errors: [
                { start: 0, end: options.generateCode('unknown user', '').length, error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                options.setup?.(ctx);
                ctx.discord.setup((m, $) => m.queryUser('unknown user', $({ noLookup: false, throw: UserNotFoundError })))
                    .rejects(new UserNotFoundError('unknown user'))
                    .mustHappen(1);
            }
        };
        yield {
            code: options.generateCode('unknown user', 'q'),
            expected: options.quiet ?? '`No user found`',
            errors: [
                { start: 0, end: options.generateCode('unknown user', 'q').length, error: new (UserNotFoundError.withDisplay(quiet))('unknown user') }
            ],
            setup(ctx) {
                options.setup?.(ctx);
                const error = options.quiet !== undefined ? UserNotFoundError.withQuiet(true, options.quiet) : UserNotFoundError;
                ctx.discord.setup((m, $) => m.queryUser('unknown user', $({ noLookup: true, throw: UserNotFoundError.withDisplay(quiet) })))
                    .rejects(new error('unknown user'))
                    .mustHappen(1);
            }
        };
    }
}

interface GetUserPropTestData<Locals extends object> {
    cases: Array<GetUserPropTestCase<Locals>>;
    quiet?: string;
    includeNoArgs?: boolean;
    generateCode: (...args: [] | [userStr: string] | [userStr: string, quiet: string]) => string;
    setup?: (context: SubtagTestContext<Locals>) => void;
}

interface GetUserPropTestCase<Locals extends object> {
    title?: string;
    expected: string;
    error?: BBTagRuntimeError;
    queryString?: string;
    generateCode?: (...args: [userStr?: string, quietStr?: string]) => string;
    setup?: (context: SubtagTestContext<Locals>, userId: bigint, quiet: boolean) => void;
}

function createTestCase<Locals extends QueryDiscordUserLocals>(data: GetUserPropTestData<Locals>, testCase: GetUserPropTestCase<Locals>, args: Parameters<GetUserPropTestData<Locals>['generateCode']>): SubtagTestCase<Locals> {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    return {
        code,
        title: testCase.title,
        expected: () => testCase.expected,
        errors: testCase.error === undefined ? [] : [{ start: 0, end: code.length, error: testCase.error }],
        setup(ctx) {
            data.setup?.(ctx);
            const userId = random.bigint(10n ** 10n, 10n ** 20n);
            const quiet = typeof args[1] === 'string' && args[1] !== '';
            const searchText = args[0] ?? '';
            const error = data.quiet !== undefined ? UserNotFoundError.withQuiet(quiet, data.quiet) : UserNotFoundError;
            ctx.discord.setup((m, $) => m.queryUser(searchText, $({ noLookup: quiet, throw: error }))).resolves(userId).mustHappen(1);

            testCase.setup?.(ctx, userId, quiet);
        }
    };
}

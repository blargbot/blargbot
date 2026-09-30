import type { BBTagRuntimeError, DiscordUserLocals } from '@blargbot/bbtag-engine';
import { UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import type { SubtagTestCase, SubtagTestContext } from '../../SubtagTestSuite.js';

export function createGetUserPropTestCases<Locals extends DiscordUserLocals>(options: GetUserPropTestData<Locals>): Array<SubtagTestCase<Locals>> {
    return [...createGetUserPropTestCasesIter(options)];
}

export function* createGetUserPropTestCasesIter<Locals extends DiscordUserLocals>(options: GetUserPropTestData<Locals>): Generator<SubtagTestCase<Locals>, void, undefined> {
    const seenCases = new Set<string>();
    function isUniqueCode(testCase: SubtagTestCase<Locals>): boolean {
        const key = `${testCase.code}|${typeof testCase.expected === 'function' ? testCase.expected() : String(testCase.expected)}`;
        if (seenCases.has(key))
            return false;
        seenCases.add(key);
        return true;
    }
    if (options.includeNoArgs !== false)
        yield* options.cases.map(c => createTestCase(options, c, [])).filter(isUniqueCode);

    yield* options.cases.map(c => createTestCase(options, c, [''])).filter(isUniqueCode);
    if (options.quiet !== false) {
        yield* options.cases.map(c => createTestCase(options, c, ['', ''])).filter(isUniqueCode);
        yield* options.cases.map(c => createTestCase(options, c, ['', 'q'])).filter(isUniqueCode);
    }
    yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'other user'])).filter(isUniqueCode);
    if (options.quiet !== false) {
        yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'other user', ''])).filter(isUniqueCode);
        yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'other user', 'q'])).filter(isUniqueCode);
    }
    yield* unknownUserCases(options).filter(isUniqueCode);
}

function* unknownUserCases<Locals extends DiscordUserLocals>(options: GetUserPropTestData<Locals>): Generator<SubtagTestCase<Locals>, void, undefined> {
    yield {
        code: options.generateCode('unknown user'),
        expected: '`No user found`',
        errors: [
            { start: 0, end: options.generateCode('unknown user').length, error: new UserNotFoundError('unknown user') }
        ],
        setup(ctx) {
            options.setup?.(ctx);
            ctx.locals.setup((m, $) => m.queryUser('unknown user', $({ noLookup: false, throw: true })))
                .rejects(new UserNotFoundError('unknown user'))
                .mustHappen(1);
        }
    };
    if (options.quiet !== false) {
        yield {
            code: options.generateCode('unknown user', ''),
            expected: '`No user found`',
            errors: [
                { start: 0, end: options.generateCode('unknown user', '').length, error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                options.setup?.(ctx);
                ctx.locals.setup((m, $) => m.queryUser('unknown user', $({ noLookup: false, throw: true })))
                    .rejects(new UserNotFoundError('unknown user'))
                    .mustHappen(1);
            }
        };
        yield {
            code: options.generateCode('unknown user', 'q'),
            expected: options.quiet ?? '`No user found`',
            errors: [
                { start: 0, end: options.generateCode('unknown user', 'q').length, error: new UserNotFoundError('unknown user').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                options.setup?.(ctx);
                ctx.locals.setup((m, $) => m.queryUser('unknown user', $({ noLookup: true, throw: typeof options.quiet === 'string' ? options.quiet : true })))
                    .rejects(new UserNotFoundError('unknown user').withDisplay(toErrorDisplay(options.quiet)))
                    .mustHappen(1);
            }
        };
    }
}

interface GetUserPropTestData<Locals extends object> {
    cases: Array<GetUserPropTestCase<Locals>>;
    quiet?: string | false;
    includeNoArgs?: boolean;
    generateCode: (...args: [] | [userId: string] | [userId: string, quiet: string]) => string;
    setup?: (context: SubtagTestContext<Locals>) => void;
}

interface GetUserPropTestCase<Locals extends object> {
    expected: string;
    error?: BBTagRuntimeError;
    queryString?: string;
    generateCode?: (...args: [userStr?: string, quietStr?: string]) => string;
    setup?: (context: SubtagTestContext<Locals>, userId: bigint, quiet: boolean) => void;
}

function createTestCase<Locals extends DiscordUserLocals>(data: GetUserPropTestData<Locals>, testCase: GetUserPropTestCase<Locals>, args: Parameters<GetUserPropTestData<Locals>['generateCode']>): SubtagTestCase<Locals> {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    return {
        code,
        expected: () => testCase.expected,
        errors: testCase.error === undefined ? [] : [{ start: 0, end: code.length, error: testCase.error }],
        setup(ctx) {
            data.setup?.(ctx);
            const userId = random.bigint(10n ** 10n, 10n ** 20n);
            const quiet = typeof args[1] === 'string' && args[1] !== '';
            if (args.length === 0 || args[0] === '') {
                ctx.locals.setup(m => m.userId).returns(userId).mustHappen(1);
            } else {
                const searchText = args[0];
                ctx.locals.setup((m, $) => m.queryUser(searchText, $({ noLookup: quiet, throw: quiet && typeof data.quiet === 'string' ? data.quiet : true }))).resolves(userId).mustHappen(1);
            }

            testCase.setup?.(ctx, userId, quiet);
        }
    };
}

function toErrorDisplay(value: undefined | boolean | string): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

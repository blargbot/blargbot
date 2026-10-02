import type { QueryDiscordRoleLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, RoleNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import type { SubtagTestCase, SubtagTestContext } from '../../SubtagTestSuite.js';

export function createGetRolePropTestCases<Locals extends QueryDiscordRoleLocals>(options: GetRolePropTestData<Locals>): Array<SubtagTestCase<Locals>> {
    return [...createGetRolePropTestCasesIter(options)];
}

function* createGetRolePropTestCasesIter<Locals extends QueryDiscordRoleLocals>(options: GetRolePropTestData<Locals>): Generator<SubtagTestCase<Locals>, void, undefined> {
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

    yield* options.cases.map(c => createTestCase(options, c, ['command'])).filter(isUniqueCode);

    if (options.quiet !== false) {
        yield* options.cases.map(c => createTestCase(options, c, ['command', ''])).filter(isUniqueCode);
        yield* options.cases.map(c => createTestCase(options, c, ['command', 'q'])).filter(isUniqueCode);
    }

    yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'other role'])).filter(isUniqueCode);
    if (options.quiet !== false) {
        yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'other role', ''])).filter(isUniqueCode);
        yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'other role', 'q'])).filter(isUniqueCode);
    }
    yield* unknownRoleTestCases(options).filter(isUniqueCode);
}
function* unknownRoleTestCases<Locals extends QueryDiscordRoleLocals>(options: GetRolePropTestData<Locals>): Generator<SubtagTestCase<Locals>, void, undefined> {
    const notFound = options.notFound ?? RoleNotFoundError;

    yield {
        code: options.generateCode('unknown role'),
        expected: `\`${new notFound('unknown role').message}\``,
        errors: [
            { start: 0, end: options.generateCode('unknown role').length, error: new notFound('unknown role') }
        ],
        setup(ctx) {
            options.setup?.(ctx);
            ctx.discord.setup((m, $) => m.queryRole('unknown role', $({ noLookup: false, throw: notFound })))
                .rejects(new notFound('unknown role'))
                .mustHappen(1);
        }
    };

    if (options.quiet !== false) {
        const quiet = options.quiet;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const withDisplay = BBTagRuntimeError.withDisplay<[string], BBTagRuntimeError>;
        const quietError = quiet === true ? notFound : withDisplay.apply(notFound, [quiet]);
        yield {
            code: options.generateCode('unknown role', ''),
            expected: `\`${new notFound('unknown role').message}\``,
            errors: [
                { start: 0, end: options.generateCode('unknown role', '').length, error: new notFound('unknown role') }
            ],
            setup(ctx) {
                options.setup?.(ctx);
                ctx.discord.setup((m, $) => m.queryRole('unknown role', $({ noLookup: false, throw: notFound })))
                    .rejects(new notFound('unknown role'))
                    .mustHappen(1);
            }
        };
        yield {
            code: options.generateCode('unknown role', 'q'),
            expected: quiet === true ? `\`${new quietError('unknown role').message}\`` : quiet,
            errors: [
                { start: 0, end: options.generateCode('unknown role', 'q').length, error: new quietError('unknown role') }
            ],
            setup(ctx) {
                options.setup?.(ctx);
                ctx.discord.setup((m, $) => m.queryRole('unknown role', $({ noLookup: true, throw: quietError })))
                    .rejects(new quietError('unknown role'))
                    .mustHappen(1);
            }
        };
    }
}

interface GetRolePropTestData<Locals extends QueryDiscordRoleLocals> {
    cases: Array<GetRolePropTestCase<Locals>>;
    quiet: string | boolean;
    generateCode: (...args: [roleStr: string] | [roleStr: string, quiet: string]) => string;
    notFound?: new (roleStr: string) => BBTagRuntimeError;
    setup?: (context: SubtagTestContext<Locals>) => void;
}

interface GetRolePropTestCase<Locals extends QueryDiscordRoleLocals> {
    title?: string;
    expected: string;
    error?: BBTagRuntimeError;
    queryString?: string;
    generateCode?: (...args: [roleStr?: string, quietStr?: string]) => string;
    setup?: (context: SubtagTestContext<Locals>, roleId: bigint, quiet: boolean) => void;
}

function createTestCase<Locals extends QueryDiscordRoleLocals>(data: GetRolePropTestData<Locals>, testCase: GetRolePropTestCase<Locals>, args: Parameters<GetRolePropTestData<Locals>['generateCode']>): SubtagTestCase<Locals> {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    return {
        code,
        title: testCase.title,
        expected: () => testCase.expected,
        errors: testCase.error === undefined ? [] : [{ start: 0, end: code.length, error: testCase.error }],
        setup(ctx) {
            data.setup?.(ctx);
            const roleId = random.bigint(10n ** 10n, 10n ** 20n);
            const quiet = typeof args[1] === 'string' && args[1] !== '';
            const searchText = args[0];
            // eslint-disable-next-line @typescript-eslint/unbound-method
            const withQuiet = BBTagRuntimeError.withQuiet<[string], BBTagRuntimeError>;
            const quietError = typeof data.quiet === 'boolean' ? data.notFound ?? RoleNotFoundError : withQuiet.apply(data.notFound ?? RoleNotFoundError, [quiet, data.quiet]);
            ctx.discord.setup((m, $) => m.queryRole(searchText, $({ noLookup: quiet, throw: quietError })))
                .resolves(roleId)
                .mustHappen(1);
            testCase.setup?.(ctx, roleId, quiet);
        }
    };
}

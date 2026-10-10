import type { QueryDiscordChannelLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, ChannelNotFoundError } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import type { SubtagTestCase, SubtagTestContext } from '../../SubtagTestSuite.js';

export function createGetChannelPropTestCases<Locals extends QueryDiscordChannelLocals>(options: GetChannelPropTestData<Locals>): Array<SubtagTestCase<Locals>> {
    return [...createGetChannelPropTestCasesIter(options)];
}

function* createGetChannelPropTestCasesIter<Locals extends QueryDiscordChannelLocals>(options: GetChannelPropTestData<Locals>): Generator<SubtagTestCase<Locals>, void, undefined> {
    const seenCases = new Set<string>();
    for (const testCase of options.cases) {
        const code = (testCase.generateCode ?? options.generateCode)('channelStr', 'quietStr');
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

    if (options.includeNoArgs === true)
        yield* options.cases.map(c => createTestCase(options, c, [])).filter(isUniqueCode);

    yield* options.cases.map(c => createTestCase(options, c, [''])).filter(isUniqueCode);
    if (options.quiet !== undefined) {
        yield* options.cases.map(c => createTestCase(options, c, ['', ''])).filter(isUniqueCode);
        yield* options.cases.map(c => createTestCase(options, c, ['', 'q'])).filter(isUniqueCode);
    }
    yield* options.cases.map(c => createTestCase(options, c, ['command'])).filter(isUniqueCode);
    if (options.quiet !== undefined) {
        yield* options.cases.map(c => createTestCase(options, c, ['command', ''])).filter(isUniqueCode);
        yield* options.cases.map(c => createTestCase(options, c, ['command', 'q'])).filter(isUniqueCode);
    }
    yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'general'])).filter(isUniqueCode);
    if (options.quiet !== undefined) {
        yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'general', ''])).filter(isUniqueCode);
        yield* options.cases.map(c => createTestCase(options, c, [c.queryString ?? 'general', 'q'])).filter(isUniqueCode);
    }

    yield* unknownChannelTestCases(options).filter(isUniqueCode);
}
function* unknownChannelTestCases<Locals extends QueryDiscordChannelLocals>(options: GetChannelPropTestData<Locals>): Generator<SubtagTestCase<Locals>, void, undefined> {
    const notFound = options.notFound ?? ChannelNotFoundError;

    yield {
        title: 'Channel not found',
        code: options.generateCode('unknown channel'),
        expected: `\`${new notFound('unknown channel').message}\``,
        errors: [
            { error: new notFound('unknown channel') }
        ],
        setup(ctx) {
            options.setup?.(ctx);
            ctx.discord.setup((m, $) => m.queryChannel('unknown channel', options.quiet === undefined ? $({ throw: notFound }) : $({ quiet: false, throw: notFound })))
                .rejects(new notFound('unknown channel'))
                .mustHappen(1);
        }
    };
    if (options.quiet !== undefined) {
        const quiet = options.quiet;
        const quietNotFound = withQuiet.apply(notFound, [true, quiet]);
        yield {
            code: options.generateCode('unknown channel', ''),
            expected: '`No channel found`',
            errors: [
                { error: new notFound('unknown channel') }
            ],
            setup(ctx) {
                options.setup?.(ctx);
                ctx.discord.setup((m, $) => m.queryChannel('unknown channel', $({ quiet: false, throw: notFound })))
                    .rejects(new notFound('unknown channel'))
                    .mustHappen(1);
            }
        };
        yield {
            code: options.generateCode('unknown channel', 'q'),
            expected: options.quiet ?? '`No channel found`',
            errors: [
                { error: new quietNotFound('unknown channel') }
            ],
            setup(ctx) {
                options.setup?.(ctx);
                ctx.discord.setup((m, $) => m.queryChannel('unknown channel', $({ quiet: true, throw: quietNotFound })))
                    .rejects(new quietNotFound('unknown channel'))
                    .mustHappen(1);
            }
        };
    }
}

interface GetChannelPropTestData<Locals extends QueryDiscordChannelLocals> {
    cases: Array<GetChannelPropTestCase<Locals>>;
    includeNoArgs?: boolean;
    quiet?: string;
    generateCode: (...args: [channelStr?: string, quietStr?: string]) => string;
    notFound?: new (channelStr: string) => BBTagRuntimeError;
    setup?: (context: SubtagTestContext<Locals>) => void;

}

interface GetChannelPropTestCase<Locals extends QueryDiscordChannelLocals> {
    title?: string;
    expected: string;
    error?: BBTagRuntimeError | ((...args: [channelStr?: string, quietStr?: string]) => BBTagRuntimeError);
    retries?: number;
    queryString?: string;
    generateCode?: (...args: [channelStr?: string, quietStr?: string]) => string;
    setup?: (context: SubtagTestContext<Locals>, channelId: bigint, quiet: boolean) => void;
}

function createTestCase<Locals extends QueryDiscordChannelLocals>(data: GetChannelPropTestData<Locals>, testCase: GetChannelPropTestCase<Locals>, args: Parameters<GetChannelPropTestData<Locals>['generateCode']>): SubtagTestCase<Locals> {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    return {
        title: testCase.title,
        code,
        expected: () => testCase.expected,
        retries: testCase.retries,
        errors: testCase.error === undefined ? []
            : testCase.error instanceof BBTagRuntimeError
                ? [{ error: testCase.error }]
                : [{ error: testCase.error(...args) }],
        setup(ctx) {
            data.setup?.(ctx);
            const channelId = randomSnowflake('channelId');
            const quiet = typeof args[1] === 'string' && args[1] !== '';
            const searchText = args[0] ?? '';
            const notFound = data.notFound ?? ChannelNotFoundError;
            const quietError = data.quiet === undefined ? notFound : withQuiet.apply(notFound, [quiet, data.quiet]);
            ctx.discord.setup((m, $) => m.queryChannel(searchText, data.quiet === undefined ? $({ throw: quietError }) : $({ quiet: quiet, throw: quietError })))
                .resolves(channelId)
                .mustHappen(1);
            testCase.setup?.(ctx, channelId, quiet);
        }
    };
}
// eslint-disable-next-line @typescript-eslint/unbound-method
const withQuiet = BBTagRuntimeError.withQuiet<[string], BBTagRuntimeError>;

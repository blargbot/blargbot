import type { BBTagContext, BBTagRuntimeError, Entities, FindEntityOptions } from '@bbtag/blargbot';
import { ChannelNotFoundError } from '@bbtag/blargbot';
import { argument } from '@blargbot/test-util/mock.js';

import type { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetChannelPropTestCases(options: GetChannelPropTestData): SubtagTestCase[] {
    if (options.quiet !== false)
        options.getQueryOptions ??= q => ({ noLookup: q });
    return [...createGetChannelPropTestCasesIter(options)];
}

function* createGetChannelPropTestCasesIter(options: GetChannelPropTestData): Generator<SubtagTestCase, void, undefined> {
    if (options.includeNoArgs === true)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', []));

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, true, c, 'command', ['', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['command']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['command', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, true, c, 'command', ['command', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'general', [c.queryString ?? 'general']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'general', [c.queryString ?? 'general', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, true, c, 'general', [c.queryString ?? 'general', 'q']));
    }

    const notFound = options.notFound ?? (c => new ChannelNotFoundError(c));

    yield {
        title: 'Channel not found',
        code: options.generateCode('12345678998765432'),
        expected: `\`${notFound('12345678998765432').message}\``,
        errors: [
            { start: 0, end: options.generateCode('12345678998765432').length, error: notFound('12345678998765432') }
        ],
        postSetup(bbctx, ctx) {
            const opt = options.getQueryOptions?.(false);
            if (opt === undefined)
                ctx.channelService.setup(m => m.querySingle(bbctx, '12345678998765432'), false).thenResolve(undefined);
            ctx.channelService.setup(m => m.querySingle(bbctx, '12345678998765432', argument.isDeepEqual(opt)), false).thenResolve(undefined);
        }
    };
    if (options.quiet !== false) {
        yield {
            title: 'Channel not found but quiet',
            code: options.generateCode('12345678998765432', 'q'),
            expected: options.quiet ?? `\`${notFound('12345678998765432').message}\``,
            errors: [
                { start: 0, end: options.generateCode('12345678998765432', 'q').length, error: notFound('12345678998765432').withDisplay(options.quiet) }
            ],
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.querySingle(bbctx, '12345678998765432', argument.isDeepEqual(options.getQueryOptions?.(true))), false).thenResolve(undefined);
            }
        };
    }
}

interface GetChannelPropTestData {
    cases: GetChannelPropTestCase[];
    includeNoArgs?: boolean;
    quiet?: string | false;
    getQueryOptions?: (quiet: boolean) => FindEntityOptions;
    generateCode: (...args: [channelStr?: string, quietStr?: string]) => string;
    notFound?: (channelStr: string) => BBTagRuntimeError;
}

interface GetChannelPropTestCase {
    title?: string;
    expected: SubtagTestCase['expected'];
    error?: BBTagRuntimeError;
    retries?: number;
    queryString?: string;
    generateCode?: (...args: [channelStr?: string, quietStr?: string]) => string;
    setup?: (channel: Entities.Channel, context: SubtagTestContext) => void;
    postSetup?: (channel: Entities.Channel, context: BBTagContext, test: SubtagTestContext) => void;
    assert?: (result: string, channel: Entities.Channel, context: BBTagContext, test: SubtagTestContext) => void;
}

function createTestCase(data: GetChannelPropTestData, isQuiet: boolean, testCase: GetChannelPropTestCase, channelKey: keyof SubtagTestContext['channels'], args: Parameters<GetChannelPropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    return {
        title: testCase.title,
        code,
        expected: testCase.expected,
        retries: testCase.retries,
        errors: testCase.error === undefined ? [] : [{ start: 0, end: code.length, error: testCase.error }],
        setup(ctx) {
            const isMessageChannel = ctx.channels[channelKey].id === ctx.message.channel_id;
            const channel = ctx.channels[channelKey];
            testCase.setup?.(channel, ctx);
            if (isMessageChannel)
                ctx.message.channel_id = channel.id;
        },
        postSetup(bbctx, ctx) {
            const channel = ctx.channels[channelKey];
            const channelQuery = args[0];
            if (channelQuery !== undefined && channelQuery !== '') {

                const opt = data.getQueryOptions?.(isQuiet);
                if (opt === undefined)
                    ctx.channelService.setup(m => m.querySingle(bbctx, channelQuery), false).thenResolve(channel);
                ctx.channelService.setup(m => m.querySingle(bbctx, channelQuery, argument.isDeepEqual(opt)), false).thenResolve(channel);
            }

            testCase.postSetup?.(channel, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            if (testCase.assert === undefined)
                return;
            const channel = ctx.channels[channelKey];
            testCase.assert(result, channel, bbctx, ctx);
        }
    };
}

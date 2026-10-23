import type { BBTagContext, BBTagRuntimeError } from '@blargbot/bbtag';
import { ChannelNotFoundError } from '@blargbot/bbtag';
import { ChannelIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import type { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetChannelPropTestCases(options: GetChannelPropTestData): SubtagTestCase[] {
    return [...createGetChannelPropTestCasesIter(options)];
}

function* createGetChannelPropTestCasesIter(options: GetChannelPropTestData): Generator<SubtagTestCase, void, undefined> {
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
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'general', [c.queryString ?? 'general']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'general', [c.queryString ?? 'general', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'general', [c.queryString ?? 'general', 'q']));
    }

    const notFound = options.notFound ?? (c => new ChannelNotFoundError(c));
    const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'channelIdSubtag' });

    yield {
        title: 'Channel not found',
        code: options.generateCode('12345678998765432'),
        expected: `\`${notFound('12345678998765432').message}\``,
        subtags: [channelIdSubtag.instance],
        errors: [
            { error: notFound('12345678998765432') }
        ],
        setup(ctx) {
            ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
        },
        postSetup(bbctx) {
            channelIdSubtag.setup((m, $) => m.query(bbctx, '12345678998765432', $(options.quiet === false ? undefined : { noLookup: false }))).resolves(undefined);
        }
    };
    if (options.quiet !== false) {
        yield {
            title: 'Channel not found but quiet',
            code: options.generateCode('12345678998765432', 'q'),
            expected: options.quiet ?? `\`${notFound('12345678998765432').message}\``,
            subtags: [channelIdSubtag.instance],
            errors: [
                { error: notFound('12345678998765432').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
            },
            postSetup(bbctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, '12345678998765432', $({ noLookup: true }))).resolves(undefined);
            }
        };
    }
}

export interface GetChannelPropTestData {
    cases: GetChannelPropTestCase[];
    includeNoArgs?: boolean;
    quiet?: string | false;
    generateCode: (...args: [channelStr?: string, quietStr?: string]) => string;
    notFound?: (channelStr: string) => BBTagRuntimeError;
}

export interface GetChannelPropTestCase {
    title?: string;
    expected: SubtagTestCase['expected'];
    channelId?: string;
    error?: BBTagRuntimeError;
    retries?: number;
    queryString?: string;
    generateCode?: (...args: [channelStr?: string, quietStr?: string]) => string;
    setup?: (channelId: string, context: SubtagTestContext) => void;
    postSetup?: (channelId: string, context: BBTagContext, test: SubtagTestContext) => void;
    assert?: (result: string, channelId: string, context: BBTagContext, test: SubtagTestContext) => void;
}

function createTestCase(data: GetChannelPropTestData, testCase: GetChannelPropTestCase, channelKey: keyof SubtagTestContext['channels'], args: Parameters<GetChannelPropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'channelIdSubtag' });
    return {
        title: testCase.title,
        code,
        expected: testCase.expected,
        retries: testCase.retries,
        subtags: [channelIdSubtag.instance],
        errors: testCase.error === undefined ? [] : [{ error: testCase.error }],
        setup(ctx) {
            const isMessageChannel = ctx.channels[channelKey].id === ctx.message.channel_id;
            const channel = ctx.channels[channelKey];
            if (testCase.channelId !== undefined)
                channel.id = testCase.channelId;
            testCase.setup?.(channel.id, ctx);
            if (isMessageChannel)
                ctx.message.channel_id = channel.id;
            ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });

        },
        postSetup(bbctx, ctx) {
            const [channelQuery, quietStr = ''] = args;
            if (channelQuery !== undefined)
                channelIdSubtag.setup((m, $) => m.query(bbctx, channelQuery, $(data.quiet === false ? undefined : { noLookup: quietStr !== '' }))).resolves(ctx.channels[channelKey].id);
            testCase.postSetup?.(ctx.channels[channelKey].id, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            testCase.assert?.(result, ctx.channels[channelKey].id, bbctx, ctx);
        }
    };
}

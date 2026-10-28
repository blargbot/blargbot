import type { BBTagContext, BBTagRuntimeError } from '@blargbot/bbtag';
import { ChannelNotFoundError } from '@blargbot/bbtag';
import { ChannelIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import type { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetChannelPropTestCases(options: GetChannelPropTestData): SubtagTestCase[] {
    return [...createGetChannelPropTestCasesIter(options)];
}

function* createGetChannelPropTestCasesIter(options: GetChannelPropTestData): Generator<SubtagTestCase, void, undefined> {
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

    const notFound = options.notFound ?? (c => new ChannelNotFoundError(c));
    const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'ChannelIdSubtag' });

    yield {
        title: 'Channel not found',
        code: options.generateCode('123456789987654329'),
        expected: `\`${notFound('123456789987654329').message}\``,
        subtags: [channelIdSubtag.instance],
        errors: [
            { error: notFound('123456789987654329') }
        ],
        setup(ctx) {
            ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
        },
        postSetup(bbctx) {
            channelIdSubtag.setup((m, $) => m.query(bbctx, '123456789987654329', $(options.quiet === false ? undefined : { noLookup: false }))).resolves(undefined);
        }
    };
    if (options.quiet !== false) {
        yield {
            title: 'Channel not found but quiet',
            code: options.generateCode('123456789987654329', 'q'),
            expected: options.quiet ?? `\`${notFound('123456789987654329').message}\``,
            subtags: [channelIdSubtag.instance],
            errors: [
                { error: notFound('123456789987654329').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
            },
            postSetup(bbctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, '123456789987654329', $({ noLookup: true }))).resolves(undefined);
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

function createTestCase(data: GetChannelPropTestData, testCase: GetChannelPropTestCase, args: Parameters<GetChannelPropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'ChannelIdSubtag' });
    const [channelQuery, quietStr = ''] = args;
    const channelId = testCase.channelId ?? `channelId<${createSnowflake()}>`;
    return {
        title: testCase.title,
        code,
        expected: testCase.expected,
        retries: testCase.retries,
        subtags: [channelIdSubtag.instance],
        errors: testCase.error === undefined ? [] : [{ error: testCase.error }],
        setup(ctx) {
            if (channelQuery === undefined)
                ctx.channelId = channelId;
            testCase.setup?.(channelId, ctx);
            ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });

        },
        postSetup(bbctx, ctx) {
            if (channelQuery !== undefined)
                channelIdSubtag.setup((m, $) => m.query(bbctx, channelQuery, $(data.quiet === false ? undefined : { noLookup: quietStr !== '' }))).resolves(channelId);
            testCase.postSetup?.(channelId, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            testCase.assert?.(result, channelId, bbctx, ctx);
        }
    };
}

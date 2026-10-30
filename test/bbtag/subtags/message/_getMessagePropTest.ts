import type { BBTagRuntimeError, QueryEntityOptions } from '@blargbot/bbtag-engine';
import { ChannelNotFoundError, MessageNotFoundError } from '@blargbot/bbtag-engine';
import { ChannelIdSubtag } from '@blargbot/bbtag-engine/subtags';
import type { Mockable, SetupMock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, type SubtagTestCase, type SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetMessagePropTestCases<Result>(options: GetMessagePropTestData<Result>): SubtagTestCase[] {
    return [...createGetMessagePropTestCasesIter(options)];
}

function* createGetMessagePropTestCasesIter<Result>(options: GetMessagePropTestData<Result>): Generator<SubtagTestCase, void, undefined> {
    if (options.includeNoArgs === true)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, []));

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, [undefined, '123456789123456789']));
    if (options.emptyIsCurrentMessage !== false)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, [undefined, '']));
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['', '123456789123456789']));
    if (options.emptyIsCurrentMessage !== false)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['', '']));
    if (typeof options.quiet !== 'boolean') {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['', '', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['', '123456789123456789', 'q']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['', '', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['command', '123456789123456789']));
    if (typeof options.quiet !== 'boolean') {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['command', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, ['command', '123456789123456789', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, [c.queryString ?? 'general', '123456789123456789']));
    if (typeof options.quiet !== 'boolean') {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, [c.queryString ?? 'general', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, [c.queryString ?? 'general', '123456789123456789', 'q']));
    }

    const channelIdSubtag = createMockSubtag(ChannelIdSubtag);

    yield {
        title: 'Message not found',
        code: options.generateCode(undefined, '123456789987654329'),
        expected: '`No message found`',
        subtags: [channelIdSubtag.instance],
        errors: [
            { error: new MessageNotFoundError('98765434567889121', '123456789987654329') }
        ],
        setup(ctx) {
            ctx.adoptMock(channelIdSubtag);
            ctx.channelId = ctx.channelId = '98765434567889121';
            const queryOpt = options.queryOptions(false);
            channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $(queryOpt)))
                .resolves(ctx.channelId);
            channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '98765434567889121', $(queryOpt)))
                .resolves('98765434567889121');
            options.getProp('98765434567889121', '123456789987654329').returns(options.notExists);
        }
    };
    yield {
        title: 'Channel not found',
        code: options.generateCode('98765434567889121', '123456789987654329'),
        expected: '`No channel found`',
        subtags: [channelIdSubtag.instance],
        errors: [
            { error: new ChannelNotFoundError('98765434567889121') }
        ],
        setup(ctx) {
            ctx.adoptMock(channelIdSubtag);
            ctx.channelId = ctx.channelId = '0987654321123456789';
            const queryOpt = options.queryOptions(false);
            channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $(queryOpt)))
                .resolves(ctx.channelId);
            channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '98765434567889121', $(queryOpt)))
                .resolves(undefined);
        }
    };
    if (typeof options.quiet !== 'boolean') {
        yield {
            title: 'Message not found but quiet',
            code: options.generateCode('98765434567889121', '123456789987654329', 'q'),
            expected: options.quiet ?? '`No message found`',
            subtags: [channelIdSubtag.instance],
            errors: [
                { error: new MessageNotFoundError('98765434567889121', '123456789987654329').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                ctx.adoptMock(channelIdSubtag);
                ctx.channelId = ctx.channelId = '98765434567889121';
                const queryOpt = options.queryOptions(true);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $(queryOpt)))
                    .resolves(ctx.channelId);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '98765434567889121', $(queryOpt)))
                    .resolves('98765434567889121');
                options.getProp('98765434567889121', '123456789987654329').returns(options.notExists);
            }
        };
        yield {
            title: 'Channel not found but quiet',
            code: options.generateCode('98765434567889121', '123456789987654329', 'q'),
            expected: options.quiet ?? '`No channel found`',
            subtags: [channelIdSubtag.instance],
            errors: [
                { error: new ChannelNotFoundError('98765434567889121').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                ctx.adoptMock(channelIdSubtag);
                ctx.channelId = ctx.channelId = '0987654321123456789';
                const queryOpt = options.queryOptions(true);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $(queryOpt)))
                    .resolves(ctx.channelId);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '98765434567889121', $(queryOpt)))
                    .resolves(undefined);
            }
        };
    }
}

interface GetMessagePropTestData<Result> {
    cases: Array<GetMessagePropTestCase<Result>>;
    includeNoArgs?: boolean;
    quiet?: string | false;
    emptyIsCurrentMessage?: boolean;
    generateCode: (...args: [channelStr?: string, messageId?: string, quietStr?: string]) => string;
    getProp: (channelId: string, messageId: string) => SetupMock<Mockable, Result>;
    notExists: NoInfer<Result>;
    queryOptions: (quiet: boolean) => QueryEntityOptions | undefined;
}

export interface GetMessagePropTestCase<Result> {
    title?: string;
    expected: SubtagTestCase['expected'];
    error?: BBTagRuntimeError;
    retries?: number;
    queryString?: string;
    generateCode?: (...args: [channelStr?: string, messageId?: string, quietStr?: string]) => string;
    setup?: (prop: SetupMock<Mockable, Result>, channelId: string, messageId: string, context: SubtagTestContext) => void;
}

function createTestCase<Result>(data: GetMessagePropTestData<Result>, testCase: GetMessagePropTestCase<Result>, args: Parameters<GetMessagePropTestData<Result>['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    const channelIdSubtag = createMockSubtag(ChannelIdSubtag);
    const channelId = `channelId<${createSnowflake()}>`;
    return {
        title: testCase.title,
        code,
        expected: testCase.expected,
        retries: testCase.retries,
        subtags: [channelIdSubtag.instance],
        errors: testCase.error === undefined ? [] : [{ error: testCase.error }],
        setup(ctx) {
            if (args[0] === undefined || args[0] === '')
                ctx.channelId = channelId;
            ctx.adoptMock(channelIdSubtag);
            const messageId = (args[1] ?? '') !== '' ? args[1]! : ctx.messageId;
            testCase.setup?.(data.getProp(channelId, messageId), channelId, messageId, ctx);
            const channelQuery = args[0] ?? channelId;
            const quietStr = args[2] ?? '';
            const queryOpt = data.queryOptions(quietStr !== '');
            channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '', $(queryOpt)))
                .resolves(ctx.channelId);
            channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, channelQuery, $(queryOpt)))
                .resolves(channelId);
        }
    };
}

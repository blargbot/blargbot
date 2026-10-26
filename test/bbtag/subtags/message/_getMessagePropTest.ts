import type { BBTagContext, BBTagRuntimeError, QueryEntityOptions } from '@blargbot/bbtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@blargbot/bbtag';
import { ChannelIdSubtag } from '@blargbot/bbtag/subtags';
import type { Mockable, SetupMock } from '@blargbot/test-util';
import { Mock } from '@blargbot/test-util';

import type { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetMessagePropTestCases<Result>(options: GetMessagePropTestData<Result>): SubtagTestCase[] {
    return [...createGetMessagePropTestCasesIter(options)];
}

function* createGetMessagePropTestCasesIter<Result>(options: GetMessagePropTestData<Result>): Generator<SubtagTestCase, void, undefined> {
    if (options.includeNoArgs === true)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', []));

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', [undefined, '123456789123456789']));
    if (options.emptyIsCurrentMessage !== false)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', [undefined, '']));
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', '123456789123456789']));
    if (options.emptyIsCurrentMessage !== false)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', '']));
    if (typeof options.quiet !== 'boolean') {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', '', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', '123456789123456789', 'q']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', '', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', '123456789123456789']));
    if (typeof options.quiet !== 'boolean') {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', '123456789123456789', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'general', [c.queryString ?? 'general', '123456789123456789']));
    if (typeof options.quiet !== 'boolean') {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'general', [c.queryString ?? 'general', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'general', [c.queryString ?? 'general', '123456789123456789', 'q']));
    }

    const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'ChannelIdSubtag' });

    yield {
        title: 'Message not found',
        code: options.generateCode(undefined, '12345678998765432'),
        expected: '`No message found`',
        subtags: [channelIdSubtag.instance],
        errors: [
            { error: new MessageNotFoundError('98765434567889121', '12345678998765432') }
        ],
        setup(ctx) {
            ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
            ctx.message.channel_id = ctx.channels.command.id = '98765434567889121';
        },
        postSetup(bbctx, ctx) {
            const queryOpt = options.queryOptions(false);
            channelIdSubtag.setup((m, $) => m.query(bbctx, '', $(queryOpt)))
                .resolves(ctx.channels.command.id);
            channelIdSubtag.setup((m, $) => m.query(bbctx, '98765434567889121', $(queryOpt)))
                .resolves('98765434567889121');
            options.getProp('98765434567889121', '12345678998765432').returns(options.notExists);
        }
    };
    yield {
        title: 'Channel not found',
        code: options.generateCode('98765434567889121', '12345678998765432'),
        expected: '`No channel found`',
        subtags: [channelIdSubtag.instance],
        errors: [
            { error: new ChannelNotFoundError('98765434567889121') }
        ],
        setup(ctx) {
            ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
            ctx.message.channel_id = ctx.channels.command.id = '0987654321123456789';
        },
        postSetup(bbctx, ctx) {
            const queryOpt = options.queryOptions(false);
            channelIdSubtag.setup((m, $) => m.query(bbctx, '', $(queryOpt)))
                .resolves(ctx.channels.command.id);
            channelIdSubtag.setup((m, $) => m.query(bbctx, '98765434567889121', $(queryOpt)))
                .resolves(undefined);
        }
    };
    if (typeof options.quiet !== 'boolean') {
        yield {
            title: 'Message not found but quiet',
            code: options.generateCode('98765434567889121', '12345678998765432', 'q'),
            expected: options.quiet ?? '`No message found`',
            subtags: [channelIdSubtag.instance],
            errors: [
                { error: new MessageNotFoundError('98765434567889121', '12345678998765432').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
                ctx.message.channel_id = ctx.channels.command.id = '98765434567889121';
            },
            postSetup(bbctx, ctx) {
                const queryOpt = options.queryOptions(true);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '', $(queryOpt)))
                    .resolves(ctx.channels.command.id);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '98765434567889121', $(queryOpt)))
                    .resolves('98765434567889121');
                options.getProp('98765434567889121', '12345678998765432').returns(options.notExists);
            }
        };
        yield {
            title: 'Channel not found but quiet',
            code: options.generateCode('98765434567889121', '12345678998765432', 'q'),
            expected: options.quiet ?? '`No channel found`',
            subtags: [channelIdSubtag.instance],
            errors: [
                { error: new ChannelNotFoundError('98765434567889121').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
                ctx.message.channel_id = ctx.channels.command.id = '0987654321123456789';
            },
            postSetup(bbctx, ctx) {
                const queryOpt = options.queryOptions(true);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '', $(queryOpt)))
                    .resolves(ctx.channels.command.id);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '98765434567889121', $(queryOpt)))
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
    postSetup?: (context: BBTagContext, channelId: string, messageId: string, test: SubtagTestContext) => void;
    assert?: (context: BBTagContext, channelId: string, messageId: string, test: SubtagTestContext) => void;
}

function createTestCase<Result>(data: GetMessagePropTestData<Result>, testCase: GetMessagePropTestCase<Result>, channelKey: keyof SubtagTestContext['channels'], args: Parameters<GetMessagePropTestData<Result>['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    const apiMessageMap = new WeakMap<SubtagTestContext, string>();
    const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'ChannelIdSubtag' });
    return {
        title: testCase.title,
        code,
        expected: testCase.expected,
        retries: testCase.retries,
        subtags: [channelIdSubtag.instance],
        errors: testCase.error === undefined ? [] : [{ error: testCase.error }],
        setup(ctx) {
            ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
            const channel = ctx.channels[channelKey];
            const messageId = (args[1] ?? '') !== '' ? args[1]! : ctx.message.id;
            testCase.setup?.(data.getProp(channel.id, messageId), channel.id, messageId, ctx);
            apiMessageMap.set(ctx, messageId);
        },
        postSetup(bbctx, ctx) {
            const channel = bbctx.root.message.channel.guild.channels.get(ctx.channels[channelKey].id);
            if (channel === undefined)
                throw new Error('Cannot find the channel under test');
            const messageId = apiMessageMap.get(ctx);
            if (messageId === undefined)
                throw new Error('Cannot find the message under test');
            const channelQuery = args[0] ?? channel.id;
            const quietStr = args[2] ?? '';
            const queryOpt = data.queryOptions(quietStr !== '');
            channelIdSubtag.setup((m, $) => m.query(bbctx, '', $(queryOpt)))
                .resolves(ctx.channels.command.id);
            channelIdSubtag.setup((m, $) => m.query(bbctx, channelQuery, $(queryOpt)))
                .resolves(channel.id);

            testCase.postSetup?.(bbctx, channel.id, messageId, ctx);
        }
    };
}

import type { BBTagRuntimeError, BBTagScript, Entities, FindEntityOptions } from '@bbtag/blargbot';
import { ChannelNotFoundError, MessageNotFoundError } from '@bbtag/blargbot';
import type Discord from '@blargbot/discord-types';
import { snowflake } from '@blargbot/discord-util';
import { argument } from '@blargbot/test-util/mock.js';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetMessagePropTestCases(options: GetMessagePropTestData): SubtagTestCase[] {
    if (options.quiet !== false)
        options.getQueryOptions ??= q => ({ noLookup: q });
    return [...createGetMessagePropTestCasesIter(options)];
}

function* createGetMessagePropTestCasesIter(options: GetMessagePropTestData): Generator<SubtagTestCase, void, undefined> {
    if (options.includeNoArgs === true)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', []));

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', [undefined, '123456789123456789']));
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['', '123456789123456789']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, true, c, 'command', ['', '123456789123456789', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['command', '123456789123456789']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'command', ['command', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, true, c, 'command', ['command', '123456789123456789', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'general', [c.queryString ?? 'general', '123456789123456789']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, false, c, 'general', [c.queryString ?? 'general', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, true, c, 'general', [c.queryString ?? 'general', '123456789123456789', 'q']));
    }
    yield {
        title: 'Message not found',
        code: options.generateCode(undefined, '12345678998765432'),
        expected: '`No message found`',
        errors: [
            { start: 0, end: options.generateCode(undefined, '12345678998765432').length, error: new MessageNotFoundError('0987654321123456789', '12345678998765432') }
        ],
        setup(ctx) {
            ctx.message.channel_id = ctx.channels.command.id = '0987654321123456789';
        },
        postSetup(bbctx, ctx) {
            ctx.inject.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678998765432'), false).thenResolve(undefined);
        }
    };
    yield {
        title: 'Channel not found',
        code: options.generateCode('98765434567889121', '12345678998765432'),
        expected: '`No channel found`',
        errors: [
            { start: 0, end: options.generateCode('98765434567889121', '12345678998765432').length, error: new ChannelNotFoundError('98765434567889121') }
        ],
        postSetup(bbctx, ctx) {
            const opt = options.getQueryOptions?.(false);
            if (opt === undefined)
                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '98765434567889121'), false).thenResolve();
            else
                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '98765434567889121', argument.isDeepEqual(opt)), false).thenResolve();
        }
    };
    if (options.quiet !== false) {
        yield {
            title: 'Message not found but quiet',
            code: options.generateCode('0987654321123456789', '12345678998765432', 'q'),
            expected: options.quiet ?? '`No message found`',
            errors: [
                { start: 0, end: options.generateCode('0987654321123456789', '12345678998765432', 'q').length, error: new MessageNotFoundError('0987654321123456789', '12345678998765432').withDisplay(options.quiet) }
            ],
            setup(ctx) {
                ctx.message.channel_id = ctx.channels.command.id = '0987654321123456789';
            },
            postSetup(bbctx, ctx) {
                ctx.inject.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678998765432'), false).thenResolve(undefined);
            }
        };
        yield {
            title: 'Channel not found but quiet',
            code: options.generateCode('98765434567889121', '12345678998765432', 'q'),
            expected: options.quiet ?? '`No channel found`',
            errors: [
                { start: 0, end: options.generateCode('98765434567889121', '12345678998765432', 'q').length, error: new ChannelNotFoundError('98765434567889121').withDisplay(options.quiet) }
            ],
            postSetup(bbctx, ctx) {
                const opt = options.getQueryOptions?.(true);
                if (opt === undefined)
                    ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '98765434567889121'), false).thenResolve();
                else
                    ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '98765434567889121', argument.isDeepEqual(opt)), false).thenResolve();
            }
        };
    }
}

interface GetMessagePropTestData {
    cases: GetMessagePropTestCase[];
    includeNoArgs?: boolean;
    quiet?: string | false;
    getQueryOptions?: (quiet: boolean) => FindEntityOptions;
    generateCode: (...args: [channelStr?: string, messageId?: string, quietStr?: string]) => string;
}

interface GetMessagePropTestCase {
    title?: string;
    expected: SubtagTestCase['expected'];
    error?: BBTagRuntimeError;
    retries?: number;
    queryString?: string;
    generateCode?: (...args: [channelStr?: string, messageId?: string, quietStr?: string]) => string;
    setup?: (channel: Entities.Channel, message: Discord.APIMessage, context: SubtagTestContext) => void;
    postSetup?: (channel: Entities.Channel, message: Entities.Message, context: BBTagScript, test: SubtagTestContext) => void;
    assert?: (result: string, channel: Entities.Channel, message: Entities.Message, context: BBTagScript, test: SubtagTestContext) => void;
}

const createSnowflake = snowflake.nextFactory();
function createTestCase(data: GetMessagePropTestData, isQuiet: boolean, testCase: GetMessagePropTestCase, channelKey: keyof SubtagTestContext['channels'], args: Parameters<GetMessagePropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    const messageMap = new WeakMap<SubtagTestContext, Entities.Message>();
    return {
        title: testCase.title,
        code,
        expected: testCase.expected,
        retries: testCase.retries,
        errors: testCase.error === undefined ? [] : [{ start: 0, end: code.length, error: testCase.error }],
        setup(ctx) {
            const channel = ctx.channels[channelKey];
            const message = args[1] !== undefined ? SubtagTestContext.createMessage({
                id: createSnowflake(),
                channel_id: channel.id
            }, ctx.users.other) : ctx.message;
            testCase.setup?.(channel, message, ctx);
            message.channel_id = channel.id;
            messageMap.set(ctx, message);
        },
        postSetup(bbctx, ctx) {
            const channel = ctx.channels[channelKey];
            const message = messageMap.get(ctx);
            if (message === undefined)
                throw new Error('Cannot find the message under test');

            const channelQuery = args[0];
            if (channelQuery !== undefined && channelQuery !== '') {
                const opt = data.getQueryOptions?.(isQuiet);
                if (opt === undefined)
                    ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, channelQuery), false).thenResolve(channel);
                else
                    ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, channelQuery, argument.isDeepEqual(opt)), false).thenResolve(channel);
            }

            ctx.inject.messages.setup(m => m.get(bbctx.runtime, channel.id, args[1] ?? ''), false).thenResolve(message);
            testCase.postSetup?.(channel, message, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            if (testCase.assert === undefined)
                return;
            const channel = ctx.channels[channelKey];
            const message = messageMap.get(ctx);
            if (message === undefined)
                throw new Error('Cannot find the message under test');
            testCase.assert(result, channel, message, bbctx, ctx);
        }
    };
}

import type { BBTagContext } from '@blargbot/bbtag';
import type { BBTagRuntimeError} from '@blargbot/bbtag/errors/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '@blargbot/bbtag/errors/index.js';
import { snowflake } from '@blargbot/core/utils/index.js';
import type Discord from 'discord-api-types/v9';
import type * as Eris from 'eris';

import type { SubtagTestCase} from '../SubtagTestSuite.js';
import { SubtagTestContext } from '../SubtagTestSuite.js';

export function createGetMessagePropTestCases(options: GetMessagePropTestData): SubtagTestCase[] {
    return [...createGetMessagePropTestCasesIter(options)];
}

function* createGetMessagePropTestCasesIter(options: GetMessagePropTestData): Generator<SubtagTestCase, void, undefined> {
    if (options.includeNoArgs === true)
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', []));

    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', [undefined, '123456789123456789']));
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', '123456789123456789']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['', '123456789123456789', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', '123456789123456789']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'command', ['command', '123456789123456789', 'q']));
    }
    yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'general', [c.queryString ?? 'general', '123456789123456789']));
    if (options.quiet !== false) {
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'general', [c.queryString ?? 'general', '123456789123456789', '']));
        yield* options.cases.map<SubtagTestCase>(c => createTestCase(options, c, 'general', [c.queryString ?? 'general', '123456789123456789', 'q']));
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
            ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678998765432'), false).thenResolve(undefined);
            ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678998765432', false), false).thenResolve(undefined);
            ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678998765432', true), false).thenResolve(undefined);
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
            ctx.util.setup(m => m.findChannels(bbctx.guild, '98765434567889121')).thenResolve([]);
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
                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678998765432'), false).thenResolve(undefined);
                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678998765432', false), false).thenResolve(undefined);
                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678998765432', true), false).thenResolve(undefined);
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
                ctx.util.setup(m => m.findChannels(bbctx.guild, '98765434567889121')).thenResolve([]);
            }
        };
    }
}

interface GetMessagePropTestData {
    cases: GetMessagePropTestCase[];
    includeNoArgs?: boolean;
    quiet?: string | false;
    generateCode: (...args: [channelStr?: string, messageId?: string, quietStr?: string]) => string;
}

interface GetMessagePropTestCase {
    title?: string;
    expected: SubtagTestCase['expected'];
    error?: BBTagRuntimeError;
    retries?: number;
    queryString?: string;
    generateCode?: (...args: [channelStr?: string, messageId?: string, quietStr?: string]) => string;
    setup?: (channel: Discord.APIChannel, message: Discord.APIMessage, context: SubtagTestContext) => void;
    postSetup?: (channel: Eris.KnownGuildChannel, message: Eris.Message<Eris.KnownTextableChannel>, context: BBTagContext, test: SubtagTestContext) => void;
    assert?: (result: string, channel: Eris.KnownGuildChannel, message: Eris.Message<Eris.KnownTextableChannel>, context: BBTagContext, test: SubtagTestContext) => void;
}

function createTestCase(data: GetMessagePropTestData, testCase: GetMessagePropTestCase, channelKey: keyof SubtagTestContext['channels'], args: Parameters<GetMessagePropTestData['generateCode']>): SubtagTestCase {
    const code = testCase.generateCode?.(...args) ?? data.generateCode(...args);
    const apiMessageMap = new WeakMap<SubtagTestContext, Discord.APIMessage>();
    const messageMap = new WeakMap<SubtagTestContext, Eris.Message<Eris.KnownTextableChannel>>();
    return {
        title: testCase.title,
        code,
        expected: testCase.expected,
        retries: testCase.retries,
        errors: testCase.error === undefined ? [] : [{ start: 0, end: code.length, error: testCase.error }],
        setup(ctx) {
            const channel = ctx.channels[channelKey];
            const message = args[1] !== undefined ? SubtagTestContext.createApiMessage({
                id: snowflake.create().toString(),
                channel_id: channel.id
            }, ctx.users.other) : ctx.message;
            testCase.setup?.(channel, message, ctx);
            message.channel_id = channel.id;
            apiMessageMap.set(ctx, message);
        },
        postSetup(bbctx, ctx) {
            const channel = bbctx.guild.channels.get(ctx.channels[channelKey].id);
            if (channel === undefined)
                throw new Error('Cannot find the channel under test');
            const apiMessage = apiMessageMap.get(ctx);
            if (apiMessage === undefined)
                throw new Error('Cannot find the message under test');

            const channelQuery = args[0];
            if (channelQuery !== undefined && channelQuery !== '')
                ctx.util.setup(m => m.findChannels(bbctx.guild, channelQuery)).thenResolve([channel]);

            const message = apiMessage === ctx.message ? bbctx.message as Eris.Message<Eris.GuildTextableChannel> : ctx.createMessage(apiMessage);
            const messageQuery = args[1];
            if (messageQuery !== undefined && messageQuery !== '') {
                ctx.util.setup(m => m.getMessage(channel, messageQuery), false).thenResolve(message);
                ctx.util.setup(m => m.getMessage(channel, messageQuery, false), false).thenResolve(message);
                ctx.util.setup(m => m.getMessage(channel, messageQuery, true), false).thenResolve(message);
            }

            messageMap.set(ctx, message);
            testCase.postSetup?.(channel, message, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            if (testCase.assert === undefined)
                return;
            const channel = bbctx.guild.channels.get(ctx.channels[channelKey].id);
            if (channel === undefined)
                throw new Error('Cannot find the channel under test');
            const message = messageMap.get(ctx);
            if (message === undefined)
                throw new Error('Cannot find the message under test');
            testCase.assert(result, channel, message, bbctx, ctx);
        }
    };
}

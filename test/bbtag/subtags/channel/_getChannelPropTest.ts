import { BBTagContext } from '@blargbot/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError } from '@blargbot/bbtag/errors';
import { APIChannel } from 'discord-api-types';
import { KnownGuildChannel } from 'eris';

import { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite';

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

    yield {
        title: 'Channel not found',
        code: options.generateCode('12345678998765432'),
        expected: `\`${notFound('12345678998765432').message}\``,
        errors: [
            { start: 0, end: options.generateCode('12345678998765432').length, error: notFound('12345678998765432') }
        ],
        postSetup(bbctx, ctx) {
            ctx.util.setup(m => m.findChannels(bbctx.guild, '12345678998765432')).thenResolve([]);
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
                ctx.util.setup(m => m.findChannels(bbctx.guild, '12345678998765432')).thenResolve([]);
            }
        };
    }
}

interface GetChannelPropTestData {
    cases: GetChannelPropTestCase[];
    includeNoArgs?: boolean;
    quiet?: string | false;
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
    setup?: (channel: APIChannel, context: SubtagTestContext) => void;
    postSetup?: (channel: KnownGuildChannel, context: BBTagContext, test: SubtagTestContext) => void;
    assert?: (result: string, channel: KnownGuildChannel, context: BBTagContext, test: SubtagTestContext) => void;
}

function createTestCase(data: GetChannelPropTestData, testCase: GetChannelPropTestCase, channelKey: keyof SubtagTestContext['channels'], args: Parameters<GetChannelPropTestData['generateCode']>): SubtagTestCase {
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
            const channel = bbctx.guild.channels.get(ctx.channels[channelKey].id);
            if (channel === undefined)
                throw new Error('Cannot find the channel under test');

            const channelQuery = args[0];
            if (channelQuery !== undefined && channelQuery !== '')
                ctx.util.setup(m => m.findChannels(bbctx.guild, channelQuery)).thenResolve([channel]);

            testCase.postSetup?.(channel, bbctx, ctx);
        },
        assert(bbctx, result, ctx) {
            if (testCase.assert === undefined)
                return;
            const channel = bbctx.guild.channels.get(ctx.channels[channelKey].id);
            if (channel === undefined)
                throw new Error('Cannot find the channel under test');
            testCase.assert(result, channel, bbctx, ctx);
        }
    };
}

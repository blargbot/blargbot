import assert from 'node:assert/strict';

import type { BBTagUtilities } from '@blargbot/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag';
import { MessageIdSubtag, OperatorSubtag, WaitMessageSubtag } from '@blargbot/bbtag/subtags';
import type { ArgumentMatchers, Callback, Mock, Mockable } from '@blargbot/test-util';
import * as eris from 'eris';

import type { SubtagTestContext } from '../SubtagTestSuite.js';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

type AwaitCondition = Exclude<Parameters<BBTagUtilities['awaitMessage']>[1], undefined>;
const anyCondition = <T>($: ArgumentMatchers<T>): AwaitCondition => $.satisfies(v => typeof v === 'function');

await runSubtagTests({
    subtag: new WaitMessageSubtag(),
    argCountBounds: { min: 0, max: { count: 4, noEval: [2] } },
    names: ['waitMessage'],
    cases: [
        {
            code: '{waitmessage}',
            expected: '`Wait timed out after 60000`',
            errors: [
                { start: 0, end: 13, error: new BBTagRuntimeError('Wait timed out after 60000') }
            ],
            setup(ctx) {
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                ctx.util.setup((m, $) => m.awaitMessage($([ctx.channels.command.id]), anyCondition($), 60000))
                    .invokes(createFakeAwaiterFactory(undefined, [rejectedMessage.instance]));
            }
        },
        {
            code: '{waitmessage}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id);
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                ctx.util.setup((m, $) => m.awaitMessage($([ctx.channels.command.id]), anyCondition($), 60000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));
            }
        },
        {
            code: '{waitmessage;21938762934928374}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id);
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 60000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);
            }
        },
        {
            code: '{waitmessage;["21938762934928374"]}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id);
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 60000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);
            }
        },
        {
            code: '{waitmessage;["21938762934928374","987234657348965","39457643897564358"]}',
            expected: '["987234657348965","3982746234283749322"]',
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', '987234657348965');
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374', '987234657348965', '39457643897564358']), anyCondition($), 60000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel1 = ctx.createMock<eris.TextChannel>();
                channel1.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel1.instance]);

                const channel2 = ctx.createMock<eris.TextChannel>();
                channel2.setup(m => m.id).returns('987234657348965');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '987234657348965')).resolves([channel2.instance]);

                const channel3 = ctx.createMock<eris.TextChannel>();
                channel3.setup(m => m.id).returns('39457643897564358');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '39457643897564358')).resolves([channel3.instance]);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 60000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);

                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('289374634729826479828');
                ctx.util.setup(m => m.getUser('289374634729826479828')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '289374634729826479828')).resolves([member.instance]);
            }
        },
        {
            code: '{waitmessage;21938762934928374;["289374634729826479828"]}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 60000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);

                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('289374634729826479828');
                ctx.util.setup(m => m.getUser('289374634729826479828')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '289374634729826479828')).resolves([member.instance]);
            }
        },
        {
            code: '{waitmessage;21938762934928374;["289374634729826479828","328762389764234374","23894767278934620893"]}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id, '328762389764234374');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 60000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);

                const member1 = ctx.createMock<eris.Member>();
                const user1 = ctx.createMock<eris.User>();
                member1.setup(m => m.user).returns(user1.instance);
                user1.setup(m => m.id).returns('289374634729826479828');
                ctx.util.setup(m => m.getUser('289374634729826479828')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '289374634729826479828')).resolves([member1.instance]);

                const member2 = ctx.createMock<eris.Member>();
                const user2 = ctx.createMock<eris.User>();
                member2.setup(m => m.user).returns(user2.instance);
                user2.setup(m => m.id).returns('328762389764234374');
                ctx.util.setup(m => m.getUser('328762389764234374')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '328762389764234374')).resolves([member2.instance]);

                const member3 = ctx.createMock<eris.Member>();
                const user3 = ctx.createMock<eris.User>();
                member3.setup(m => m.user).returns(user3.instance);
                user3.setup(m => m.id).returns('23894767278934620893');
                ctx.util.setup(m => m.getUser('23894767278934620893')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '23894767278934620893')).resolves([member3.instance]);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval}{==;{messageid};3982746234283749322}}',
            expected: '["9834653278429843564","3982746234283749322"]',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 53, end: 59, error: new MarkerError('eval', 53) }
            ],
            subtags: [new OperatorSubtag(), new MessageIdSubtag()],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '5847658249242834983', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 60000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [filterableMessage.instance, rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);

                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('289374634729826479828');
                ctx.util.setup(m => m.getUser('289374634729826479828')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '289374634729826479828')).resolves([member.instance]);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval}{==;{messageid};3982746234283749322};10}',
            expected: '["9834653278429843564","3982746234283749322"]',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 53, end: 59, error: new MarkerError('eval', 53) }
            ],
            subtags: [new OperatorSubtag(), new MessageIdSubtag()],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '5847658249242834983', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 10000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [filterableMessage.instance, rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);

                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('289374634729826479828');
                ctx.util.setup(m => m.getUser('289374634729826479828')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '289374634729826479828')).resolves([member.instance]);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval}{==;{messageid};3982746234283749322};-20}',
            expected: '["9834653278429843564","3982746234283749322"]',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 53, end: 59, error: new MarkerError('eval', 53) }
            ],
            subtags: [new OperatorSubtag(), new MessageIdSubtag()],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '5847658249242834983', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 0))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [filterableMessage.instance, rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);

                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('289374634729826479828');
                ctx.util.setup(m => m.getUser('289374634729826479828')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '289374634729826479828')).resolves([member.instance]);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval}{==;{messageid};3982746234283749322};310}',
            expected: '["9834653278429843564","3982746234283749322"]',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 53, end: 59, error: new MarkerError('eval', 53) }
            ],
            subtags: [new OperatorSubtag(), new MessageIdSubtag()],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '5847658249242834983', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 300000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [filterableMessage.instance, rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);

                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('289374634729826479828');
                ctx.util.setup(m => m.getUser('289374634729826479828')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '289374634729826479828')).resolves([member.instance]);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval}false;310}',
            expected: '`Wait timed out after 300000`',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 0, end: 69, error: new BBTagRuntimeError('Wait timed out after 300000') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '5847658249242834983', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 300000))
                    .invokes(createFakeAwaiterFactory(acceptedMessage.instance, [filterableMessage.instance, rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);

                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('289374634729826479828');
                ctx.util.setup(m => m.getUser('289374634729826479828')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '289374634729826479828')).resolves([member.instance]);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval} abc;310}',
            expected: '`Condition must return \'true\' or \'false\'`',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 0, end: 68, error: new BBTagRuntimeError('Condition must return \'true\' or \'false\'', 'Actually returned " abc"') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const rejectedMessage = createFilterableMessage(ctx, bbctx.local.message.channel.guild, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                ctx.util.setup((m, $) => m.awaitMessage($(['21938762934928374']), anyCondition($), 300000))
                    .invokes(createFakeAwaiterFactory(undefined, [rejectedMessage.instance]));

                const channel = ctx.createMock<eris.TextChannel>();
                channel.setup(m => m.id).returns('21938762934928374');
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);

                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('289374634729826479828');
                ctx.util.setup(m => m.getUser('289374634729826479828')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '289374634729826479828')).resolves([member.instance]);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{fail};abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 64, error: new NotANumberError('abc') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.createMock<eris.TextChannel>();
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '21938762934928374')).resolves([channel.instance]);

                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                member.setup(m => m.user).returns(user.instance);
                ctx.util.setup(m => m.getUser('289374634729826479828')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '289374634729826479828')).resolves([member.instance]);
            }
        }
    ]
});

function createFakeAwaiterFactory<T extends Mockable>(result: eris.KnownMessage | undefined, expectedFails: eris.KnownMessage[] = []): Callback<T, Promise<eris.KnownMessage | undefined>> {
    return async i => {
        const condition = i.arguments[1] as AwaitCondition;
        for (const value of expectedFails)
            assert.equal(await condition(value), false);
        if (result === undefined)
            return undefined;
        if (await condition(result))
            return result;
        return undefined;
    };
}

function createFilterableMessage(
    ctx: SubtagTestContext,
    guild: eris.Guild,
    messageId: string,
    channelId = ctx.channels.command.id,
    userId = ctx.users.command.id
): Mock<eris.KnownMessage> {
    const message = ctx.createMock<eris.KnownMessage>();
    message.setup(Reflect.getPrototypeOf).returns(eris.Message);
    const channel = ctx.createMock<eris.TextChannel>();
    const author = ctx.createMock<eris.User>();
    message.setup(m => m.channel).returns(channel.instance);
    message.setup(m => m.author).returns(author.instance);
    message.setup(m => m.id).returns(messageId, { isFallback: true });
    channel.setup(m => m.guild).returns(guild);
    channel.setup(m => 'guild' in m).returns(true);
    channel.setup(m => m.id).returns(channelId, { isFallback: true });
    author.setup(m => m.id).returns(userId);

    return message;
}

function createRejectedMessage(
    ctx: SubtagTestContext,
    userId = ctx.users.command.id
): Mock<eris.KnownMessage> {
    const message = ctx.createMock<eris.KnownMessage>();
    message.setup(Reflect.getPrototypeOf).returns(eris.Message);
    const author = ctx.createMock<eris.User>();
    message.setup(m => m.author).returns(author.instance);
    author.setup(m => m.id).returns(userId);

    return message;
}

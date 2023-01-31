import type { Entities, MessageService } from '@blargbot/bbtag';
import { BBTagRuntimeError, NotANumberError, Subtag  } from '@blargbot/bbtag';
import { MessageIdSubtag, OperatorSubtag, WaitMessageSubtag  } from '@blargbot/bbtag/subtags';
import type { Mock } from '@blargbot/test-util/mock.js';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import type { SubtagTestContext } from '../SubtagTestSuite.js';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

type AwaitCondition = Exclude<Parameters<MessageService['awaitMessage']>[2], undefined>;
const anyCondition = argument.is((v): v is AwaitCondition => typeof v === 'function');

runSubtagTests({
    subtag: Subtag.getDescriptor(WaitMessageSubtag),
    argCountBounds: { min: 0, max: { count: 4, noEval: [2] } },
    cases: [
        {
            code: '{waitmessage}',
            expected: '`Wait timed out after 60000`',
            errors: [
                { start: 0, end: 13, error: new BBTagRuntimeError('Wait timed out after 60000') }
            ],
            postSetup(bbctx, ctx) {
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual([ctx.channels.command.id]), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(undefined, [rejectedMessage.instance]));
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
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id);
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual([ctx.channels.command.id]), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));
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
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id);
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);
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
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id);
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);
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
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', '987234657348965');
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374', '987234657348965', '39457643897564358']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel1 = ctx.createMock<Entities.Channel>();
                channel1.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel1.instance);

                const channel2 = ctx.createMock<Entities.Channel>();
                channel2.setup(m => m.id).thenReturn('987234657348965');
                ctx.channelService.setup(m => m.querySingle(bbctx, '987234657348965', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel2.instance);

                const channel3 = ctx.createMock<Entities.Channel>();
                channel3.setup(m => m.id).thenReturn('39457643897564358');
                ctx.channelService.setup(m => m.querySingle(bbctx, '39457643897564358', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel3.instance);
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
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('289374634729826479828');
                ctx.userService.setup(m => m.querySingle(bbctx, '289374634729826479828', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user.instance);
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
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('289374634729826479828');
                ctx.userService.setup(m => m.querySingle(bbctx, '289374634729826479828', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user.instance);
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
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id, '328762389764234374');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);

                const user1 = ctx.createMock<Entities.User>();
                user1.setup(m => m.id).thenReturn('289374634729826479828');
                ctx.userService.setup(m => m.querySingle(bbctx, '289374634729826479828', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user1.instance);

                const user2 = ctx.createMock<Entities.User>();
                user2.setup(m => m.id).thenReturn('328762389764234374');
                ctx.userService.setup(m => m.querySingle(bbctx, '328762389764234374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user2.instance);

                const user3 = ctx.createMock<Entities.User>();
                user3.setup(m => m.id).thenReturn('23894767278934620893');
                ctx.userService.setup(m => m.querySingle(bbctx, '23894767278934620893', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user3.instance);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval}{==;{messageid};3982746234283749322}}',
            expected: '["9834653278429843564","3982746234283749322"]',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 53, end: 59, error: new MarkerError('eval', 53) }
            ],
            subtags: [Subtag.getDescriptor(OperatorSubtag), Subtag.getDescriptor(MessageIdSubtag)],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, '5847658249242834983', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [filterableMessage.instance, rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('289374634729826479828');
                ctx.userService.setup(m => m.querySingle(bbctx, '289374634729826479828', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval}{==;{messageid};3982746234283749322};10}',
            expected: '["9834653278429843564","3982746234283749322"]',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 53, end: 59, error: new MarkerError('eval', 53) }
            ],
            subtags: [Subtag.getDescriptor(OperatorSubtag), Subtag.getDescriptor(MessageIdSubtag)],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, '5847658249242834983', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 10000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [filterableMessage.instance, rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('289374634729826479828');
                ctx.userService.setup(m => m.querySingle(bbctx, '289374634729826479828', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval}{==;{messageid};3982746234283749322};-20}',
            expected: '["9834653278429843564","3982746234283749322"]',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 53, end: 59, error: new MarkerError('eval', 53) }
            ],
            subtags: [Subtag.getDescriptor(OperatorSubtag), Subtag.getDescriptor(MessageIdSubtag)],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, '5847658249242834983', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 0))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [filterableMessage.instance, rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('289374634729826479828');
                ctx.userService.setup(m => m.querySingle(bbctx, '289374634729826479828', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval}{==;{messageid};3982746234283749322};310}',
            expected: '["9834653278429843564","3982746234283749322"]',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 53, end: 59, error: new MarkerError('eval', 53) }
            ],
            subtags: [Subtag.getDescriptor(OperatorSubtag), Subtag.getDescriptor(MessageIdSubtag)],
            setup(ctx) {
                ctx.channels.command.id = '9834653278429843564';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, '5847658249242834983', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 300000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [filterableMessage.instance, rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('289374634729826479828');
                ctx.userService.setup(m => m.querySingle(bbctx, '289374634729826479828', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user.instance);
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
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, '5847658249242834983', ctx.channels.command.id, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 300000))
                    .thenCall(createFakeAwaiterFactory(acceptedMessage.instance, [filterableMessage.instance, rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('289374634729826479828');
                ctx.userService.setup(m => m.querySingle(bbctx, '289374634729826479828', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user.instance);
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
                const rejectedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channels.command.id, '289374634729826479828');
                ctx.messageService.setup(m => m.awaitMessage(bbctx, argument.isDeepEqual(['21938762934928374']), anyCondition.value, 300000))
                    .thenCall(createFakeAwaiterFactory(undefined, [rejectedMessage.instance]));

                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('289374634729826479828');
                ctx.userService.setup(m => m.querySingle(bbctx, '289374634729826479828', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user.instance);
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
                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('21938762934928374');
                ctx.channelService.setup(m => m.querySingle(bbctx, '21938762934928374', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel.instance);

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('289374634729826479828');
                ctx.userService.setup(m => m.querySingle(bbctx, '289374634729826479828', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(user.instance);
            }
        }
    ]
});

function createFakeAwaiterFactory(result: Entities.Message | undefined, expectedFails: Entities.Message[] = []): MessageService['awaitMessage'] {
    return async (_, __, condition) => {
        for (const value of expectedFails)
            chai.expect(await condition(value)).to.be.false;
        if (result === undefined)
            return undefined;
        if (await condition(result))
            return result;
        return undefined;
    };
}

function createFilterableMessage(
    ctx: SubtagTestContext,
    messageId: string,
    channelId = ctx.channels.command.id,
    userId = ctx.users.command.id
): Mock<Entities.Message> {
    const message = ctx.createMock<Entities.Message>();
    const author = ctx.createMock<Entities.User>();
    message.setup(m => m.channel_id).thenReturn(channelId);
    message.setup(m => m.author).thenReturn(author.instance);
    message.setup(m => m.id, false).thenReturn(messageId);
    author.setup(m => m.id).thenReturn(userId);

    return message;
}

function createRejectedMessage(
    ctx: SubtagTestContext,
    userId = ctx.users.command.id
): Mock<Entities.Message> {
    const message = ctx.createMock<Entities.Message>();
    const author = ctx.createMock<Entities.User>();
    message.setup(m => m.author).thenReturn(author.instance);
    author.setup(m => m.id).thenReturn(userId);

    return message;
}

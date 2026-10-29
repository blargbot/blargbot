import type { MessageEvent } from '@blargbot/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag';
import type { StreamMessagesFeature } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, MessageIdSubtag, OperatorSubtag, UserIdSubtag, WaitMessageSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import type { SubtagTestContext } from '../SubtagTestSuite.js';
import { createMockSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<StreamMessagesFeature>({ id: 'features' });
const channelIdSubtag = createMockSubtag(ChannelIdSubtag);
const userIdSubtag = createMockSubtag(UserIdSubtag);

await runSubtagTests({
    subtag: new WaitMessageSubtag(features.instance),
    argCountBounds: { min: 0, max: { count: 4, noEval: [2] } },
    names: ['waitMessage'],
    otherSubtags: [
        channelIdSubtag.instance,
        userIdSubtag.instance
    ],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(channelIdSubtag);
        ctx.adoptMock(userIdSubtag);
    },
    cases: [
        {
            code: '{waitmessage}',
            expected: '`Wait timed out after 60000`',
            errors: [
                { error: new BBTagRuntimeError('Wait timed out after 60000') }
            ],
            setup(ctx) {
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                features.setup((m, $) => m.streamMessages($([ctx.channelId]), 60000))
                    .yieldsAsync([rejectedMessage]);
            }
        },
        {
            code: '{waitmessage}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId);
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                features.setup((m, $) => m.streamMessages($([ctx.channelId]), 60000))
                    .yieldsAsync([rejectedMessage, acceptedMessage]);
            }
        },
        {
            code: '{waitmessage;21938762934928374}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId);
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 60000))
                    .yieldsAsync([rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true })))
                    .resolves('21938762934928374')
                    .mustHappen(1);
            }
        },
        {
            code: '{waitmessage;["21938762934928374"]}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId);
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 60000))
                    .yieldsAsync([rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true })))
                    .resolves('21938762934928374')
                    .mustHappen(1);
            }
        },
        {
            code: '{waitmessage;["21938762934928374","987234657348965","39457643897564358"]}',
            expected: '["987234657348965","3982746234283749322"]',
            setup(ctx) {
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', '987234657348965');
                const rejectedMessage = createRejectedMessage(ctx, '23897464293623984274432');
                features.setup((m, $) => m.streamMessages($(['21938762934928374', '987234657348965', '39457643897564358']), 60000))
                    .yieldsAsync([rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '987234657348965', $({ noLookup: true }))).resolves('987234657348965').mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '39457643897564358', $({ noLookup: true }))).resolves('39457643897564358').mustHappen(1);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 60000))
                    .yieldsAsync([rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '289374634729826479828', $({ noLookup: true, global: true }))).resolves('289374634729826479828').mustHappen(1);
            }
        },
        {
            code: '{waitmessage;21938762934928374;["289374634729826479828"]}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 60000))
                    .yieldsAsync([rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '289374634729826479828', $({ noLookup: true, global: true }))).resolves('289374634729826479828').mustHappen(1);
            }
        },
        {
            code: '{waitmessage;21938762934928374;["289374634729826479828","328762389764234374","23894767278934620893"]}',
            expected: '["9834653278429843564","3982746234283749322"]',
            setup(ctx) {
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId, '328762389764234374');
                const rejectedMessage = createRejectedMessage(ctx);
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 60000))
                    .yieldsAsync([rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '289374634729826479828', $({ noLookup: true, global: true }))).resolves('289374634729826479828').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '328762389764234374', $({ noLookup: true, global: true }))).resolves('328762389764234374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '23894767278934620893', $({ noLookup: true, global: true }))).resolves('23894767278934620893').mustHappen(1);
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
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, '5847658249242834983', ctx.channelId, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 60000))
                    .yieldsAsync([filterableMessage, rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '289374634729826479828', $({ noLookup: true, global: true }))).resolves('289374634729826479828').mustHappen(1);
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
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, '5847658249242834983', ctx.channelId, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 10000))
                    .yieldsAsync([filterableMessage, rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '289374634729826479828', $({ noLookup: true, global: true }))).resolves('289374634729826479828').mustHappen(1);
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
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, '5847658249242834983', ctx.channelId, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 0))
                    .yieldsAsync([filterableMessage, rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '289374634729826479828', $({ noLookup: true, global: true }))).resolves('289374634729826479828').mustHappen(1);
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
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, '5847658249242834983', ctx.channelId, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 300000))
                    .yieldsAsync([filterableMessage, rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '289374634729826479828', $({ noLookup: true, global: true }))).resolves('289374634729826479828').mustHappen(1);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval}false;310}',
            expected: '`Wait timed out after 300000`',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { error: new BBTagRuntimeError('Wait timed out after 300000') }
            ],
            setup(ctx) {
                ctx.channelId = '9834653278429843564';
                const acceptedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId, '289374634729826479828');
                const filterableMessage = createFilterableMessage(ctx, '5847658249242834983', ctx.channelId, '289374634729826479828');
                const rejectedMessage = createRejectedMessage(ctx);
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 300000))
                    .yieldsAsync([filterableMessage, rejectedMessage, acceptedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '289374634729826479828', $({ noLookup: true, global: true }))).resolves('289374634729826479828').mustHappen(1);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{eval} abc;310}',
            expected: '`Condition must return \'true\' or \'false\'`',
            errors: [
                { start: 53, end: 59, error: new MarkerError('eval', 53) },
                { error: new BBTagRuntimeError('Condition must return \'true\' or \'false\'', 'Actually returned " abc"') }
            ],
            setup(ctx) {
                ctx.channelId = '9834653278429843564';
                const rejectedMessage = createFilterableMessage(ctx, '3982746234283749322', ctx.channelId, '289374634729826479828');
                features.setup((m, $) => m.streamMessages($(['21938762934928374']), 300000))
                    .yieldsAsync([rejectedMessage]);

                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '289374634729826479828', $({ noLookup: true, global: true }))).resolves('289374634729826479828').mustHappen(1);
            }
        },
        {
            code: '{waitmessage;21938762934928374;289374634729826479828;{fail};abc}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ],
            setup(ctx) {
                ctx.channelId = '9834653278429843564';
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '21938762934928374', $({ noLookup: true }))).resolves('21938762934928374').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '289374634729826479828', $({ noLookup: true, global: true }))).resolves('289374634729826479828').mustHappen(1);
            }
        }
    ]
});

function createFilterableMessage(
    ctx: SubtagTestContext,
    messageId: string,
    channelId = ctx.channelId,
    userId = ctx.userId
): MessageEvent {
    return {
        guildId: ctx.guildId,
        authorId: userId,
        channelId,
        messageId
    };
}

function createRejectedMessage(
    ctx: SubtagTestContext,
    userId = ctx.userId
): MessageEvent {
    return {
        guildId: ctx.guildId,
        authorId: userId,
        channelId: createSnowflake(),
        messageId: createSnowflake()
    };
}

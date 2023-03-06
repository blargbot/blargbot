import type { AwaitReactionsResponse, Entities, MessageService } from '@bbtag/blargbot';
import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { MessageIdSubtag, OperatorSubtag, ReactionSubtag, ReactionUserSubtag, WaitReactionSubtag } from '@bbtag/blargbot/subtags';
import { Emote } from '@blargbot/discord-emote';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import type { SubtagTestContext } from '../SubtagTestSuite.js';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

type AwaitCondition = Exclude<Parameters<MessageService['awaitReaction']>[2], undefined>;
const anyCondition = argument.is((v): v is AwaitCondition => typeof v === 'function');

runSubtagTests({
    subtag: Subtag.getDescriptor(WaitReactionSubtag),
    argCountBounds: { min: 1, max: { count: 5, noEval: [3] } },
    cases: [
        {
            code: '{waitreaction;328974628744623874}',
            expected: '`Wait timed out after 60000`',
            errors: [
                { start: 0, end: 33, error: new BBTagRuntimeError('Wait timed out after 60000') }
            ],
            postSetup(bbctx, ctx) {
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '23642834762378964232');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(undefined, [rejectedReaction]));
            }
        },
        {
            code: '{waitreaction;328974628744623874}',
            expected: '["2384792374232398472","328974628744623874","23642834762378964232","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.users.command.id = '23642834762378964232';
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23642834762378964232');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction]));
            }
        },
        {
            code: '{waitreaction;["328974628744623874"]}',
            expected: '["2384792374232398472","328974628744623874","23642834762378964232","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.users.command.id = '23642834762378964232';
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23642834762378964232');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction]));
            }
        },
        {
            code: '{waitreaction;["328974628744623874","34897465835684954375","9328479238794834798487"]}',
            expected: '["2384792374232398472","34897465835684954375","23642834762378964232","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.users.command.id = '23642834762378964232';
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '34897465835684954375', '2384792374232398472', '23642834762378964232');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874', '34897465835684954375', '9328479238794834798487']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction]));
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;["23897462384627348293436"]}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;["23897462384627348293436","9234874534905735485","39857623874642873"]}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction]));

                const user1 = ctx.createMock<Entities.User>();
                user1.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user1.instance);

                const user2 = ctx.createMock<Entities.User>();
                user2.setup(m => m.id).thenReturn('9234874534905735485');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '9234874534905735485', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user2.instance);

                const user3 = ctx.createMock<Entities.User>();
                user3.setup(m => m.id).thenReturn('39857623874642873');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '39857623874642873', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user3.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;🤔}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '❌', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;🤔❌}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;🤔❌}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","❌"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;["🤔❌"]}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;["🤔❌"]}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","❌"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;["🤔","❌"]}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;["🤔","❌"]}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","❌"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}{==;{messageid};328974628744623874}}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) }
            ],
            subtags: [Subtag.getDescriptor(OperatorSubtag), Subtag.getDescriptor(MessageIdSubtag)],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, '🤔', '238746283794634234', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction, filteredReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}{==;{reaction};🤔}}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) }
            ],
            subtags: [Subtag.getDescriptor(OperatorSubtag), Subtag.getDescriptor(ReactionSubtag)],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction, filteredReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}{==;{reactionuser};23897462384627348293436}}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) }
            ],
            subtags: [Subtag.getDescriptor(OperatorSubtag), Subtag.getDescriptor(ReactionUserSubtag)],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}false}',
            expected: '`Wait timed out after 60000`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 0, end: 70, error: new BBTagRuntimeError('Wait timed out after 60000') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction, filteredReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval} abc}',
            expected: '`Condition must return \'true\' or \'false\'`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 0, end: 69, error: new BBTagRuntimeError('Condition must return \'true\' or \'false\'', 'Actually returned " abc"') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const rejectedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(undefined, [rejectedReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}false;10}',
            expected: '`Wait timed out after 10000`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 0, end: 73, error: new BBTagRuntimeError('Wait timed out after 10000') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 10000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction, filteredReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}false;-1}',
            expected: '`Wait timed out after 0`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 0, end: 73, error: new BBTagRuntimeError('Wait timed out after 0') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 0))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction, filteredReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}false;310}',
            expected: '`Wait timed out after 300000`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 0, end: 74, error: new BBTagRuntimeError('Wait timed out after 300000') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.dependencies.message.setup(m => m.awaitReaction(bbctx, argument.isDeepEqual(['328974628744623874']), anyCondition.value, 300000))
                    .thenCall(createFakeAwaiterFactory(acceptedReaction, [rejectedReaction, filteredReaction]));

                const user = ctx.createMock<Entities.User>();
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.dependencies.user.setup(m => m.querySingle(bbctx, '23897462384627348293436', argument.isDeepEqual({ noErrors: true, noLookup: true })))
                    .thenResolve(user.instance);
            }
        }
    ]
});

function createFakeAwaiterFactory(result: AwaitReactionsResponse | undefined, expectedFails: AwaitReactionsResponse[] = []): MessageService['awaitReaction'] {
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

function createFilterableReaction(
    ctx: SubtagTestContext,
    emote: string,
    messageId: string,
    channelId = ctx.channels.command.id,
    userId = ctx.users.command.id
): AwaitReactionsResponse {
    const message = ctx.createMock<Entities.Message>();
    const reactor = ctx.createMock<Entities.User>();
    message.setup(m => m.id, false).thenReturn(messageId);
    message.setup(m => m.channel_id, false).thenReturn(channelId);
    reactor.setup(m => m.id).thenReturn(userId);

    return {
        message: message.instance,
        user: reactor.instance,
        reaction: Emote.parse(emote)
    };
}

function createRejectedReaction(
    ctx: SubtagTestContext,
    emote: string,
    userId = ctx.users.command.id
): AwaitReactionsResponse {
    const message = ctx.createMock<Entities.Message>();
    const reactor = ctx.createMock<Entities.User>();
    reactor.setup(m => m.id).thenReturn(userId);

    return {
        message: message.instance,
        reaction: Emote.parse(emote),
        user: reactor.instance
    };
}

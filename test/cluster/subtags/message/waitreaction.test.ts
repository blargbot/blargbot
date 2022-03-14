import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { Awaiter } from '@blargbot/cluster/managers';
import { ReactionAwaiterFactory } from '@blargbot/cluster/managers/awaiters/ReactionAwaiterFactory';
import { MessageIdSubtag } from '@blargbot/cluster/subtags/message/messageid';
import { ReactionSubtag } from '@blargbot/cluster/subtags/message/reaction';
import { ReactionUserSubtag } from '@blargbot/cluster/subtags/message/reactionuser';
import { WaitReactionSubtag } from '@blargbot/cluster/subtags/message/waitreaction';
import { OperatorSubtag } from '@blargbot/cluster/subtags/misc/operator';
import { AwaitReactionsResponse } from '@blargbot/cluster/types';
import { Emote } from '@blargbot/core/Emote';
import { expect } from 'chai';
import { Guild, KnownMessage, Member, Message, TextChannel, User } from 'eris';

import { argument } from '../../../mock';
import { MarkerError, runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';

type AwaitCondition = Exclude<Parameters<ReactionAwaiterFactory['getAwaiter']>[1], undefined>;
const anyCondition = argument.is((v): v is AwaitCondition => typeof v === 'function');

runSubtagTests({
    subtag: new WaitReactionSubtag(),
    argCountBounds: { min: 1, max: { count: 5, noEval: [3] } },
    cases: [
        {
            code: '{waitreaction;328974628744623874}',
            expected: '`Wait timed out after 60000`',
            errors: [
                { start: 0, end: 33, error: new BBTagRuntimeError('Wait timed out after 60000') }
            ],
            setup(ctx) {
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '23642834762378964232');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, undefined, [rejectedReaction]));
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23642834762378964232');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction]));
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23642834762378964232');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction]));
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '34897465835684954375', '2384792374232398472', '23642834762378964232');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874', '34897465835684954375', '9328479238794834798487']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction]));
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction]));

                const member1 = ctx.createMock(Member);
                const user1 = ctx.createMock(User);
                member1.setup(m => m.user).thenReturn(user1.instance);
                user1.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member1.instance]);

                const member2 = ctx.createMock(Member);
                const user2 = ctx.createMock(User);
                member2.setup(m => m.user).thenReturn(user2.instance);
                user2.setup(m => m.id).thenReturn('9234874534905735485');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '9234874534905735485')).thenResolve([member2.instance]);

                const member3 = ctx.createMock(Member);
                const user3 = ctx.createMock(User);
                member3.setup(m => m.user).thenReturn(user3.instance);
                user3.setup(m => m.id).thenReturn('39857623874642873');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '39857623874642873')).thenResolve([member3.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '❌', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction1, rejectedReaction2]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}{==;{messageid};328974628744623874}}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) }
            ],
            subtags: [new OperatorSubtag(), new MessageIdSubtag()],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '238746283794634234', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction, filteredReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}{==;{reaction};🤔}}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) }
            ],
            subtags: [new OperatorSubtag(), new ReactionSubtag()],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction, filteredReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}{==;{reactionuser};23897462384627348293436}}',
            expected: '["2384792374232398472","328974628744623874","23897462384627348293436","🤔"]',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) }
            ],
            subtags: [new OperatorSubtag(), new ReactionUserSubtag()],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction, filteredReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}abc}',
            expected: '`Wait timed out after 60000`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 0, end: 68, error: new BBTagRuntimeError('Wait timed out after 60000') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 60000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction, filteredReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 10000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction, filteredReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 0))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction, filteredReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                ctx.managers.reactionAwaiter.setup(m => m.getAwaiter(argument.isDeepEqual(['328974628744623874']), anyCondition.value, 300000))
                    .thenCall(createFakeAwaiterFactory(ctx, acceptedReaction, [rejectedReaction, filteredReaction]));

                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.id).thenReturn('23897462384627348293436');
                ctx.util.setup(m => m.findMembers(bbctx.guild, '23897462384627348293436')).thenResolve([member.instance]);
            }
        }
    ]
});

function createFakeAwaiterFactory(context: SubtagTestContext, result: AwaitReactionsResponse | undefined, expectedFails: AwaitReactionsResponse[] = []): ReactionAwaiterFactory['getAwaiter'] {
    return (_: unknown, condition: AwaitCondition) => {
        const awaiter = context.createMock(Awaiter);
        awaiter.setup(m => m.wait()).thenCall(async () => {
            for (const value of expectedFails)
                expect(await condition(value)).to.be.false;
            if (result === undefined)
                return undefined;
            if (await condition(result))
                return result;
            return undefined;
        });
        return awaiter.instance;
    };
}

function createFilterableReaction(
    ctx: SubtagTestContext,
    guild: Guild,
    emote: string,
    messageId: string,
    channelId = ctx.channels.command.id,
    userId = ctx.users.command.id
): AwaitReactionsResponse {
    const message = ctx.createMock<KnownMessage>(Message);
    const channel = ctx.createMock(TextChannel);
    const reactor = ctx.createMock(User);
    message.setup(m => m.channel).thenReturn(channel.instance);
    message.setup(m => m.id, false).thenReturn(messageId);
    channel.setup(m => m.guild).thenReturn(guild);
    channel.setup(m => m.id, false).thenReturn(channelId);
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
    const message = ctx.createMock<KnownMessage>(Message);
    const reactor = ctx.createMock(User);
    reactor.setup(m => m.id).thenReturn(userId);

    return {
        message: message.instance,
        reaction: Emote.parse(emote),
        user: reactor.instance
    };
}

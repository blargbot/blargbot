import type { ReactionEvent } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { StreamReactionsThunk } from '@blargbot/bbtag/subtags';
import { MessageIdSubtag, OperatorSubtag, ReactionSubtag, ReactionUserSubtag, WaitReactionSubtag } from '@blargbot/bbtag/subtags';
import { Emote } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import type { SubtagTestContext } from '../SubtagTestSuite.js';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const streamReactions = new Mock<StreamReactionsThunk>({ id: 'streamReactions', callable: true });

await runSubtagTests({
    subtag: new WaitReactionSubtag({
        streamReactions: streamReactions.instance
    }),
    argCountBounds: { min: 1, max: { count: 5, noEval: [3] } },
    names: ['waitReaction', 'waitReact'],
    setup(ctx) {
        ctx.adoptMock(streamReactions);
    },
    cases: [
        {
            code: '{waitreaction;328974628744623874}',
            expected: '`Wait timed out after 60000`',
            errors: [
                { error: new BBTagRuntimeError('Wait timed out after 60000') }
            ],
            setup(ctx) {
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '23642834762378964232');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23642834762378964232');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23642834762378964232');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '34897465835684954375', '2384792374232398472', '23642834762378964232');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                streamReactions.setup((m, $) => m($(['328974628744623874', '34897465835684954375', '9328479238794834798487']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '❌', '34798538573498574398');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);

                const member1 = ctx.createMock<eris.Member>({ id: 'member1' });
                const user1 = ctx.createMock<eris.User>({ id: 'user1' });
                member1.setup(m => m.user).returns(user1.instance);
                user1.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member1.instance]);

                const member2 = ctx.createMock<eris.Member>({ id: 'member2' });
                const user2 = ctx.createMock<eris.User>({ id: 'user2' });
                member2.setup(m => m.user).returns(user2.instance);
                user2.setup(m => m.id).returns('9234874534905735485');
                ctx.util.setup(m => m.getUser('9234874534905735485')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '9234874534905735485')).resolves([member2.instance]);

                const member3 = ctx.createMock<eris.Member>({ id: 'member3' });
                const user3 = ctx.createMock<eris.User>({ id: 'user3' });
                member3.setup(m => m.user).returns(user3.instance);
                user3.setup(m => m.id).returns('39857623874642873');
                ctx.util.setup(m => m.getUser('39857623874642873')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '39857623874642873')).resolves([member3.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '❌', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction1 = createRejectedReaction(ctx, '✅', '23897462384627348293436');
                const rejectedReaction2 = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '238746283794634234', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
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
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}false}',
            expected: '`Wait timed out after 60000`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { error: new BBTagRuntimeError('Wait timed out after 60000') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval} abc}',
            expected: '`Condition must return \'true\' or \'false\'`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { error: new BBTagRuntimeError('Condition must return \'true\' or \'false\'', 'Actually returned " abc"') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const rejectedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}false;10}',
            expected: '`Wait timed out after 10000`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { error: new BBTagRuntimeError('Wait timed out after 10000') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 10000))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}false;-1}',
            expected: '`Wait timed out after 0`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { error: new BBTagRuntimeError('Wait timed out after 0') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 0))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
            }
        },
        {
            code: '{waitreaction;328974628744623874;23897462384627348293436;;{eval}false;310}',
            expected: '`Wait timed out after 300000`',
            errors: [
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { start: 58, end: 64, error: new MarkerError('eval', 58) },
                { error: new BBTagRuntimeError('Wait timed out after 300000') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384792374232398472';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                const acceptedReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '🤔', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const filteredReaction = createFilterableReaction(ctx, bbctx.root.message.channel.guild, '❌', '328974628744623874', '2384792374232398472', '23897462384627348293436');
                const rejectedReaction = createRejectedReaction(ctx, '🤔', '32409764893267492832423');
                streamReactions.setup((m, $) => m($(['328974628744623874']), 300000))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns('23897462384627348293436');
                ctx.util.setup(m => m.getUser('23897462384627348293436')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '23897462384627348293436')).resolves([member.instance]);
            }
        }
    ]
});

function createFilterableReaction(
    ctx: SubtagTestContext,
    guild: eris.Guild,
    emote: string,
    messageId: string,
    channelId = ctx.channels.command.id,
    userId = ctx.users.command.id
): ReactionEvent {
    const message = ctx.createMock<eris.KnownMessage>({ id: 'message' });
    message.setup(Reflect.getPrototypeOf).returns(eris.Message);
    const channel = ctx.createMock<eris.TextChannel>({ id: 'channel' });
    const reactor = ctx.createMock<eris.User>({ id: 'reactor' });
    message.setup(m => m.channel).returns(channel.instance);
    message.setup(m => m.id).returns(messageId, { isFallback: true });
    channel.setup(m => m.guild).returns(guild);
    channel.setup(m => 'guild' in m).returns(true);
    channel.setup(m => m.id).returns(channelId, { isFallback: true });
    reactor.setup(m => m.id).returns(userId);

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
): ReactionEvent {
    const message = ctx.createMock<eris.KnownMessage>({ id: 'message' });
    message.setup(Reflect.getPrototypeOf).returns(eris.Message);
    const reactor = ctx.createMock<eris.User>({ id: 'reactor' });
    reactor.setup(m => m.id).returns(userId);

    return {
        message: message.instance,
        reaction: Emote.parse(emote),
        user: reactor.instance
    };
}

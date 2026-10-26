import type { ReactionEvent } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { StreamReactionsFeature } from '@blargbot/bbtag/subtags';
import { MessageIdSubtag, OperatorSubtag, ReactionSubtag, ReactionUserSubtag, UserIdSubtag, WaitReactionSubtag } from '@blargbot/bbtag/subtags';
import { Emote } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import type { SubtagTestContext } from '../SubtagTestSuite.js';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<StreamReactionsFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new WaitReactionSubtag(features.instance),
    argCountBounds: { min: 1, max: { count: 5, noEval: [3] } },
    names: ['waitReaction', 'waitReact'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
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
                features.setup((m, $) => m.streamReactions($(['328974628744623874', '34897465835684954375', '9328479238794834798487']), 60000))
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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);
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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '9234874534905735485', $({ noLookup: true, global: true }))).resolves('9234874534905735485').mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '39857623874642873', $({ noLookup: true, global: true }))).resolves('39857623874642873').mustHappen(1);
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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction1, rejectedReaction2, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 60000))
                    .yieldsAsync([rejectedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 10000))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 0))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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
                features.setup((m, $) => m.streamReactions($(['328974628744623874']), 300000))
                    .yieldsAsync([rejectedReaction, filteredReaction, acceptedReaction]);

                userIdSubtag.setup((m, $) => m.query(bbctx, '23897462384627348293436', $({ noLookup: true, global: true }))).resolves('23897462384627348293436').mustHappen(1);

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

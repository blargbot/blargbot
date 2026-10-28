import { BBTagRuntimeError, ChannelNotFoundError, DiscordPermissions, MessageNotFoundError } from '@blargbot/bbtag';
import type { CheckMessageExistsFeature, GetMemberPermissionsFeature, ListMessageReactionsFeature, RemoveMessageReactionUserFeature } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, IsStaffSubtag, ReactionRemoveSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import Emote from '@blargbot/discord-emote';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CheckMessageExistsFeature & GetMemberPermissionsFeature & ListMessageReactionsFeature & RemoveMessageReactionUserFeature>({ id: 'features' });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'ChannelIdSubtag' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });
const isStaffSubtag = new Mock<IsStaffSubtag>({ id: 'IsStaffSubtag' });

await runSubtagTests({
    subtag: new ReactionRemoveSubtag(features.instance),
    argCountBounds: { min: 1, max: Infinity },
    names: ['reactionRemove', 'reactRemove', 'removeReact'],
    otherSubtags: [
        isStaffSubtag.instance,
        channelIdSubtag.instance,
        userIdSubtag.instance
    ],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
        ctx.adoptSubtagMock(isStaffSubtag, { type: IsStaffSubtag });
    },
    cases: [
        {
            code: '{reactremove;2938453289453240}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = ctx.channelId;
                const userId = ctx.userId;
                const emotes = [new Emote('🤔'), new Emote('notlikecat', 280110565161041921n)];
                channelIdSubtag.setup((m, $) => m.query(bbctx, channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, userId, $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                features.setup(m => m.listMessageReactions(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = ctx.userId;
                const emotes = [new Emote('🤔'), new Emote('notlikecat', 280110565161041921n)];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, userId, $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                features.setup(m => m.listMessageReactions(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;2938453289453240;other}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = ctx.channelId;
                const userId = createSnowflake();
                const emotes = [new Emote('🤔'), new Emote('notlikecat', 280110565161041921n)];
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2938453289453240', $({ noErrors: true, noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                features.setup(m => m.listMessageReactions(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                const emotes = [new Emote('🤔'), new Emote('notlikecat', 280110565161041921n)];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                features.setup(m => m.listMessageReactions(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = ctx.channelId;
                const userId = createSnowflake();
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2938453289453240', $({ noErrors: true, noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = ctx.userId;
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '🤔', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, userId, $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`Invalid Emojis`',
            errors: [
                { error: new BBTagRuntimeError('Invalid Emojis') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`No channel found`',
            errors: [
                { error: new ChannelNotFoundError('general') }
            ],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`I need to be able to Manage Messages to remove reactions`',
            errors: [
                { error: new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.NONE)
                    .mustHappen(1);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`No message found`',
            errors: [
                { error: new MessageNotFoundError('2389476728423424378', '2938453289453240') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = '2389476728423424378';
                const userId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`Author must be staff to modify unrelated messages`',
            errors: [
                { error: new BBTagRuntimeError('Author must be staff to modify unrelated messages') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = ctx.userId;
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, userId, $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`Invalid Emojis`',
            errors: [
                { error: new BBTagRuntimeError('Invalid Emojis') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = ctx.userId;
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, userId, $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;<:fakeemote:192612896213677963>}',
            expected: '`Unknown Emoji: <:fakeemote:192612896213677963>`',
            errors: [
                { error: new BBTagRuntimeError('Unknown Emoji: <:fakeemote:192612896213677963>') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                const emotes = [new Emote('fakeemote', 192612896213677963n)];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: false })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '`I need to be able to Manage Messages to remove reactions`',
            errors: [
                { error: new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.NONE)
                    .mustHappen(1);
            }
        }
    ]
});

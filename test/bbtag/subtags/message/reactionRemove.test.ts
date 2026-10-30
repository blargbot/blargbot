import { BBTagRuntimeError, ChannelNotFoundError, DiscordPermissions, MessageNotFoundError } from '@blargbot/bbtag-engine';
import type { CheckMessageExistsFeature, GetMemberPermissionsFeature, ListMessageReactionsFeature, RemoveMessageReactionUserFeature } from '@blargbot/bbtag-engine/subtags';
import { ChannelIdSubtag, IsStaffSubtag, ReactionRemoveSubtag, UserIdSubtag } from '@blargbot/bbtag-engine/subtags';
import Emote from '@blargbot/discord-emote';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CheckMessageExistsFeature & GetMemberPermissionsFeature & ListMessageReactionsFeature & RemoveMessageReactionUserFeature>({ id: 'features' });
const channelIdSubtag = createMockSubtag(ChannelIdSubtag);
const userIdSubtag = createMockSubtag(UserIdSubtag);
const isStaffSubtag = createMockSubtag(IsStaffSubtag);

const sut = new ReactionRemoveSubtag(features.instance);
await runSubtagTests({
    subtag: sut,
    argCountBounds: { min: 1, max: Infinity },
    names: ['reactionRemove', 'reactRemove', 'removeReact'],
    otherSubtags: [
        isStaffSubtag.instance,
        channelIdSubtag.instance,
        userIdSubtag.instance
    ],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(channelIdSubtag);
        ctx.adoptMock(userIdSubtag);
        ctx.adoptMock(isStaffSubtag);
    },
    cases: [
        {
            code: '{reactremove;2938453289453240}',
            expected: '',
            setup(ctx) {
                const channelId = ctx.channelId;
                const userId = ctx.userId;
                const emotes = [new Emote('🤔'), new Emote('notlikecat', 280110565161041921n)];
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, userId, $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                features.setup(m => m.listMessageReactions(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240}',
            expected: '',
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = ctx.userId;
                const emotes = [new Emote('🤔'), new Emote('notlikecat', 280110565161041921n)];
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, userId, $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                features.setup(m => m.listMessageReactions(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;2938453289453240;other}',
            expected: '',
            setup(ctx) {
                const channelId = ctx.channelId;
                const userId = createSnowflake();
                const emotes = [new Emote('🤔'), new Emote('notlikecat', 280110565161041921n)];
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '2938453289453240', $({ noErrors: true, noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                features.setup(m => m.listMessageReactions(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other}',
            expected: '',
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                const emotes = [new Emote('🤔'), new Emote('notlikecat', 280110565161041921n)];
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                features.setup(m => m.listMessageReactions(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;2938453289453240;other;🤔}',
            expected: '',
            setup(ctx) {
                const channelId = ctx.channelId;
                const userId = createSnowflake();
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '2938453289453240', $({ noErrors: true, noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;🤔}',
            expected: '',
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = ctx.userId;
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '🤔', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, userId, $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`Invalid Emojis`',
            errors: [
                { error: new BBTagRuntimeError('Invalid Emojis') }
            ],
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
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
            setup(ctx) {
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noErrors: true, noLookup: true })))
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
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
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
            setup(ctx) {
                const channelId = '2389476728423424378';
                const userId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
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
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = ctx.userId;
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, userId, $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`Invalid Emojis`',
            errors: [
                { error: new BBTagRuntimeError('Invalid Emojis') }
            ],
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = ctx.userId;
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, userId, $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
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
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                const emotes = [new Emote('fakeemote', 192612896213677963n)];
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                features.setup(m => m.checkMessageExists(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    features.setup((m, $) => m.removeMessageReactionUser(channelId, '2938453289453240', $(emote), userId))
                        .resolves({ success: false })
                        .mustHappen(1);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '`I need to be able to Manage Messages to remove reactions`',
            errors: [
                { error: new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions') }
            ],
            setup(ctx) {
                const channelId = createSnowflake();
                const userId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other', $({ noErrors: true, noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.botId, channelId))
                    .resolves(DiscordPermissions.NONE)
                    .mustHappen(1);
            }
        }
    ]
});

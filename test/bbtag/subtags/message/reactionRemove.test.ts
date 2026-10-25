import { BBTagRuntimeError, ChannelNotFoundError, DiscordPermissions, MessageNotFoundError } from '@blargbot/bbtag';
import type { CheckMessageExistsThunk, GetUserPermissionsThunk, IsUserStaffThunk, ListMessageReactionsThunk, RemoveMessageReactionUserThunk } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, IsStaffSubtag, ReactionRemoveSubtag } from '@blargbot/bbtag/subtags';
import { Emote, snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const isUserStaff = new Mock<IsUserStaffThunk>({ id: 'isUserStaff', callable: true });
const checkMessageExists = new Mock<CheckMessageExistsThunk>({ id: 'checkMessageExists', callable: true });
const getUserPermissions = new Mock<GetUserPermissionsThunk>({ id: 'getUserPermissions', callable: true });
const listMessageReactions = new Mock<ListMessageReactionsThunk>({ id: 'listMessageReactions', callable: true });
const removeMessageReactionUser = new Mock<RemoveMessageReactionUserThunk>({ id: 'removeMessageReactionUser', callable: true });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'channelIdSubtag' });

await runSubtagTests({
    subtag: new ReactionRemoveSubtag({
        checkMessageExists: checkMessageExists.instance,
        getUserPermissions: getUserPermissions.instance,
        listMessageReactions: listMessageReactions.instance,
        removeMessageReactionUser: removeMessageReactionUser.instance
    }),
    argCountBounds: { min: 1, max: Infinity },
    names: ['reactionRemove', 'reactRemove', 'removeReact'],
    otherSubtags: [
        new IsStaffSubtag({
            isUserStaff: isUserStaff.instance
        }),
        channelIdSubtag.instance
    ],
    setup(ctx) {
        ctx.adoptMock(isUserStaff);
        ctx.adoptMock(checkMessageExists);
        ctx.adoptMock(getUserPermissions);
        ctx.adoptMock(listMessageReactions);
        ctx.adoptMock(removeMessageReactionUser);
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
    },
    cases: [
        {
            code: '{reactremove;2938453289453240}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = ctx.channels.command.id;
                const emotes = [new Emote('🤔'), new Emote('notlikecat', '280110565161041921')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
                listMessageReactions.setup(m => m(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    removeMessageReactionUser.setup((m, $) => m(channelId, '2938453289453240', $(emote), ctx.users.command.id))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                const emotes = [new Emote('🤔'), new Emote('notlikecat', '280110565161041921')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
                listMessageReactions.setup(m => m(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    removeMessageReactionUser.setup((m, $) => m(channelId, '2938453289453240', $(emote), ctx.users.command.id))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;2938453289453240;other}',
            expected: '',
            postSetup(bbctx, ctx) {
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = ctx.channels.command.id;
                const emotes = [new Emote('🤔'), new Emote('notlikecat', '280110565161041921')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2938453289453240', $({ noErrors: true, noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
                listMessageReactions.setup(m => m(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    removeMessageReactionUser.setup((m, $) => m(channelId, '2938453289453240', $(emote), otherUser.id))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other}',
            expected: '',
            postSetup(bbctx, ctx) {
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = snowflake.create().toString();
                const emotes = [new Emote('🤔'), new Emote('notlikecat', '280110565161041921')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
                listMessageReactions.setup(m => m(channelId, '2938453289453240'))
                    .resolves(emotes)
                    .mustHappen(1);
                for (const emote of emotes)
                    removeMessageReactionUser.setup((m, $) => m(channelId, '2938453289453240', $(emote), otherUser.id))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
            }
        },
        {
            code: '{reactremove;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = ctx.channels.command.id;
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2938453289453240', $({ noErrors: true, noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    removeMessageReactionUser.setup((m, $) => m(channelId, '2938453289453240', $(emote), otherUser.id))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('🤔')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '🤔')).resolves([]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    removeMessageReactionUser.setup((m, $) => m(channelId, '2938453289453240', $(emote), ctx.users.command.id))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = snowflake.create().toString();
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    removeMessageReactionUser.setup((m, $) => m(channelId, '2938453289453240', $(emote), otherUser.id))
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
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
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
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noErrors: true, noLookup: true })))
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
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
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
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = '2389476728423424378';
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
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
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = snowflake.create().toString();
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    removeMessageReactionUser.setup((m, $) => m(channelId, '2938453289453240', $(emote), otherUser.id))
                        .resolves({ success: true })
                        .mustHappen(1);
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                const emotes = [new Emote('🤔')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    removeMessageReactionUser.setup((m, $) => m(channelId, '2938453289453240', $(emote), ctx.users.command.id))
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
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
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
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = snowflake.create().toString();
                const emotes = [new Emote('fakeemote', '192612896213677963')];
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.MANAGE_MESSAGES)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(channelId, '2938453289453240'))
                    .resolves(true)
                    .mustHappen(1);
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id))
                    .resolves(true)
                    .mustHappen(1);
                for (const emote of emotes)
                    removeMessageReactionUser.setup((m, $) => m(channelId, '2938453289453240', $(emote), otherUser.id))
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
                const otherUser = bbctx.root.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup((m, $) => m.query(bbctx, 'general', $({ noErrors: true, noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other')).resolves([otherUser]);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                    .resolves(DiscordPermissions.NONE)
                    .mustHappen(1);
            }
        }
    ]
});

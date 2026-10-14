import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError, UserNotFoundError } from '@blargbot/bbtag';
import { ReactionRemoveSubtag } from '@blargbot/bbtag/subtags';
import * as eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ReactionRemoveSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    names: ['reactionRemove', 'reactRemove', 'removeReact'],
    setup(ctx) {
        ctx.roles.bot.permissions = eris.Constants.Permissions.manageMessages.toString();
        ctx.isStaff = true;
    },
    cases: [
        {
            code: '{reactremove;2938453289453240}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: bbctx.local.message.channel.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, message.id, true)).resolves(message);
                ctx.discord.setup(m => m.removeMessageReaction(message.channel.id, message.id, '🤔', ctx.users.command.id)).mustHappen(1).resolves(undefined);
                ctx.discord.setup(m => m.removeMessageReaction(message.channel.id, message.id, 'notlikecat:280110565161041921', ctx.users.command.id)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: general.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).resolves(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', ctx.users.command.id)).mustHappen(1).resolves(undefined);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, 'notlikecat:280110565161041921', ctx.users.command.id)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;2938453289453240;other}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: bbctx.local.message.channel.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '2938453289453240')).resolves([]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getUser(otherUser.id)).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, otherUser.id)).resolves([otherUser]);
                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, message.id, true)).resolves(message);
                ctx.discord.setup(m => m.removeMessageReaction(bbctx.local.message.channel.id, message.id, '🤔', otherUser.id)).mustHappen(1).resolves(undefined);
                ctx.discord.setup(m => m.removeMessageReaction(bbctx.local.message.channel.id, message.id, 'notlikecat:280110565161041921', otherUser.id)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(2).resolves(undefined);
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: general.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getUser(otherUser.id)).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, otherUser.id)).resolves([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).resolves(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', otherUser.id)).mustHappen(1).resolves(undefined);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, 'notlikecat:280110565161041921', otherUser.id)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: bbctx.local.message.channel.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '2938453289453240')).resolves([]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getUser(otherUser.id)).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, otherUser.id)).resolves([otherUser]);
                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, message.id, true)).resolves(message);
                ctx.discord.setup(m => m.removeMessageReaction(bbctx.local.message.channel.id, message.id, '🤔', otherUser.id)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: general.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('🤔')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '🤔')).resolves([]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).resolves(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', ctx.users.command.id)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: general.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getUser(otherUser.id)).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, otherUser.id)).resolves([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).resolves(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', otherUser.id)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`Invalid Emojis`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Invalid Emojis') }
            ],
            postSetup(bbctx, ctx) {
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: general.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getUser(otherUser.id)).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, otherUser.id)).resolves([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).resolves(message);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`No channel found`',
            errors: [
                { start: 0, end: 48, error: new ChannelNotFoundError('027346489624927346') }
            ],
            setup(ctx) {
                ctx.channels.general.id = '027346489624927346';
            },
            postSetup(bbctx, ctx) {
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`I need to be able to Manage Messages to remove reactions`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions') }
            ],
            setup(ctx) {
                ctx.roles.bot.permissions = '0';
            },
            postSetup(bbctx, ctx) {
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`No message found`',
            errors: [
                { start: 0, end: 48, error: new MessageNotFoundError('2389476728423424378', '2938453289453240') }
            ],
            setup(ctx) {
                ctx.channels.general.id = '2389476728423424378';
            },
            postSetup(bbctx, ctx) {
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getMessage(general, '2938453289453240', true)).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`Author must be staff to modify unrelated messages`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Author must be staff to modify unrelated messages') }
            ],
            setup(ctx) {
                ctx.isStaff = false;
            },
            postSetup(bbctx, ctx) {
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: general.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).resolves(message);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            setup(ctx) {
                ctx.isStaff = false;
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
                bbctx.root.ownedMessageIds.add('2938453289453240');
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: general.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getUser(otherUser.id)).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, otherUser.id)).resolves([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).resolves(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', otherUser.id)).mustHappen(1).resolves(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 48, error: new UserNotFoundError('3298746234246796432') }
            ],
            setup(ctx) {
                ctx.users.other.id = '3298746234246796432';
            },
            postSetup(bbctx, ctx) {
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: general.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getUser(otherUser.id)).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, otherUser.id)).resolves([]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).resolves(message);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;<:fakeemote:192612896213677963>}',
            expected: '`Unknown Emoji: <:fakeemote:192612896213677963>`',
            errors: [
                { start: 0, end: 76, error: new BBTagRuntimeError('Unknown Emoji: <:fakeemote:192612896213677963>') }
            ],
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: general.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getUser(otherUser.id)).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, otherUser.id)).resolves([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).resolves(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, 'fakeemote:192612896213677963', otherUser.id)).mustHappen(1)
                    .rejects(ctx.createRESTError(eris.ApiError.UNKNOWN_EMOJI));

            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '`I need to be able to Manage Messages to remove reactions`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions') }
            ],
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).mustHappen(1).resolves(undefined);
                const general = bbctx.local.message.channel.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.local.message.channel.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: general.id,
                    reactions: [
                        {
                            emoji: { id: null, name: '🤔' },
                            count: 1,
                            me: false
                        },
                        {
                            emoji: { id: '280110565161041921', name: 'notlikecat' },
                            count: 1,
                            me: false
                        }
                    ]
                }, ctx.users.other));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, 'general')).resolves([general]);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, general.id)).resolves([general]);
                ctx.util.setup(m => m.getUser('other')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other')).resolves([otherUser]);
                ctx.util.setup(m => m.getUser(otherUser.id)).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, otherUser.id)).resolves([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).resolves(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', otherUser.id)).mustHappen(1)
                    .rejects(ctx.createRESTError(eris.ApiError.MISSING_PERMISSIONS));

            }
        }
    ]
});

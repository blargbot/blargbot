import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError, UserNotFoundError } from '@blargbot/bbtag/errors';
import { ReactRemoveSubtag } from '@blargbot/bbtag/subtags/message/reactremove';
import { ApiError, Constants } from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ReactRemoveSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    setup(ctx) {
        ctx.roles.bot.permissions = Constants.Permissions.manageMessages.toString();
        ctx.isStaff = true;
    },
    cases: [
        {
            code: '{reactremove;2938453289453240}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(2).thenResolve(undefined);
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: bbctx.channel.id,
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

                ctx.util.setup(m => m.getMessage(bbctx.channel, message.id, true)).thenResolve(message);
                ctx.discord.setup(m => m.removeMessageReaction(message.channel.id, message.id, '🤔', ctx.users.command.id)).verifiable(1).thenResolve(undefined);
                ctx.discord.setup(m => m.removeMessageReaction(message.channel.id, message.id, 'notlikecat:280110565161041921', ctx.users.command.id)).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(2).thenResolve(undefined);
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).thenResolve(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', ctx.users.command.id)).verifiable(1).thenResolve(undefined);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, 'notlikecat:280110565161041921', ctx.users.command.id)).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{reactremove;2938453289453240;other}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(2).thenResolve(undefined);
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: bbctx.channel.id,
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, '2938453289453240')).thenResolve([]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, otherUser.id)).thenResolve([otherUser]);
                ctx.util.setup(m => m.getMessage(bbctx.channel, message.id, true)).thenResolve(message);
                ctx.discord.setup(m => m.removeMessageReaction(bbctx.channel.id, message.id, '🤔', otherUser.id)).verifiable(1).thenResolve(undefined);
                ctx.discord.setup(m => m.removeMessageReaction(bbctx.channel.id, message.id, 'notlikecat:280110565161041921', otherUser.id)).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(2).thenResolve(undefined);
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, otherUser.id)).thenResolve([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).thenResolve(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', otherUser.id)).verifiable(1).thenResolve(undefined);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, 'notlikecat:280110565161041921', otherUser.id)).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{reactremove;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(1).thenResolve(undefined);
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938453289453240',
                    channel_id: bbctx.channel.id,
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, '2938453289453240')).thenResolve([]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, otherUser.id)).thenResolve([otherUser]);
                ctx.util.setup(m => m.getMessage(bbctx.channel, message.id, true)).thenResolve(message);
                ctx.discord.setup(m => m.removeMessageReaction(bbctx.channel.id, message.id, '🤔', otherUser.id)).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(1).thenResolve(undefined);
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '🤔')).thenResolve([]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).thenResolve(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', ctx.users.command.id)).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(1).thenResolve(undefined);
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, otherUser.id)).thenResolve([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).thenResolve(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', otherUser.id)).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`Invalid Emojis`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Invalid Emojis') }
            ],
            postSetup(bbctx, ctx) {
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, otherUser.id)).thenResolve([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).thenResolve(message);
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
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
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
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
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
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
                if (otherUser === undefined)
                    throw new Error('Other user is missing');

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.getMessage(general, '2938453289453240', true)).thenResolve(undefined);
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
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).thenResolve(message);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            setup(ctx) {
                ctx.isStaff = false;
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(1).thenResolve(undefined);
                bbctx.data.ownedMsgs.push('2938453289453240');
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, otherUser.id)).thenResolve([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).thenResolve(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', otherUser.id)).verifiable(1).thenResolve(undefined);
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
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, otherUser.id)).thenResolve([]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).thenResolve(message);
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;<:fakeemote:192612896213677963>}',
            expected: '`Unknown Emoji: <:fakeemote:192612896213677963>`',
            errors: [
                { start: 0, end: 76, error: new BBTagRuntimeError('Unknown Emoji: <:fakeemote:192612896213677963>') }
            ],
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(1).thenResolve(undefined);
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, otherUser.id)).thenResolve([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).thenResolve(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, 'fakeemote:192612896213677963', otherUser.id)).verifiable(1)
                    .thenReject(ctx.createRESTError(ApiError.UNKNOWN_EMOJI));

            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '`I need to be able to Manage Messages to remove reactions`',
            errors: [
                { start: 0, end: 47, error: new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions') }
            ],
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(1).thenResolve(undefined);
                const general = bbctx.guild.channels.get(ctx.channels.general.id);
                if (general === undefined)
                    throw new Error('General channel is missing');
                const otherUser = bbctx.guild.members.get(ctx.users.other.id);
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

                ctx.util.setup(m => m.findChannels(bbctx.guild, 'general')).thenResolve([general]);
                ctx.util.setup(m => m.findChannels(bbctx.guild, general.id)).thenResolve([general]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other')).thenResolve([otherUser]);
                ctx.util.setup(m => m.findMembers(bbctx.guild, otherUser.id)).thenResolve([otherUser]);
                ctx.util.setup(m => m.getMessage(general, message.id, true)).thenResolve(message);
                ctx.discord.setup(m => m.removeMessageReaction(general.id, message.id, '🤔', otherUser.id)).verifiable(1)
                    .thenReject(ctx.createRESTError(ApiError.MISSING_PERMISSIONS));

            }
        }
    ]
});

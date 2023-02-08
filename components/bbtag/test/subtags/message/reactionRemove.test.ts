import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError, Subtag, UserNotFoundError } from '@bbtag/blargbot';
import { ReactionRemoveSubtag } from '@bbtag/blargbot/subtags';
import { Emote } from '@blargbot/discord-emote';
import { argument } from '@blargbot/test-util/mock.js';
import * as Discord from 'discord-api-types/v10';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

const think = Emote.parse('🤔');
const notLikeCat = Emote.parse('notlikecat:280110565161041921');
const fakeEmote = Emote.parse('fakeemote:192612896213677963');

runSubtagTests({
    subtag: Subtag.getDescriptor(ReactionRemoveSubtag),
    argCountBounds: { min: 1, max: Infinity },
    setupEach(ctx) {
        ctx.roles.bot.permissions = Discord.PermissionFlagsBits.ManageMessages.toString();
        ctx.isStaff = true;
    },
    cases: [
        {
            code: '{reactremove;2938453289453240}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(2).thenResolve(undefined);
                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.messageService.setup(m => m.get(bbctx, bbctx.channel.id, message.id)).thenResolve(message);
                ctx.messageService.setup(m => m.removeReactions(bbctx, message.channel_id, message.id, ctx.users.command.id, argument.isDeepEqual([think, notLikeCat])))
                    .thenResolve({ success: [think, notLikeCat], failed: [] });
            }
        },
        {
            code: '{reactremove;general;2938453289453240}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(2).thenResolve(undefined);
                const general = ctx.channels.general;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.get(bbctx, general.id, message.id)).thenResolve(message);
                ctx.messageService.setup(m => m.removeReactions(bbctx, general.id, message.id, ctx.users.command.id, argument.isDeepEqual([think, notLikeCat])))
                    .thenResolve({ success: [think, notLikeCat], failed: [] });
            }
        },
        {
            code: '{reactremove;2938453289453240;other}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(2).thenResolve(undefined);
                const otherUser = ctx.users.other;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, '2938453289453240', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve();
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.userService.setup(m => m.querySingle(bbctx, otherUser.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.messageService.setup(m => m.get(bbctx, bbctx.channel.id, message.id)).thenResolve(message);
                ctx.messageService.setup(m => m.removeReactions(bbctx, bbctx.channel.id, message.id, otherUser.id, argument.isDeepEqual([think, notLikeCat])))
                    .thenResolve({ success: [think, notLikeCat], failed: [] });
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(2).thenResolve(undefined);
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.userService.setup(m => m.querySingle(bbctx, otherUser.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.messageService.setup(m => m.get(bbctx, general.id, message.id)).thenResolve(message);
                ctx.messageService.setup(m => m.removeReactions(bbctx, general.id, message.id, otherUser.id, argument.isDeepEqual([think, notLikeCat])))
                    .thenResolve({ success: [think, notLikeCat], failed: [] });
            }
        },
        {
            code: '{reactremove;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(1).thenResolve(undefined);
                const otherUser = ctx.users.other;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, '2938453289453240', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve();
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.userService.setup(m => m.querySingle(bbctx, otherUser.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.messageService.setup(m => m.get(bbctx, bbctx.channel.id, message.id)).thenResolve(message);
                ctx.messageService.setup(m => m.removeReactions(bbctx, bbctx.channel.id, message.id, otherUser.id, argument.isDeepEqual([think])))
                    .thenResolve({ success: [think], failed: [] });
            }
        },
        {
            code: '{reactremove;general;2938453289453240;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(1).thenResolve(undefined);
                const general = ctx.channels.general;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, '🤔', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(undefined);
                ctx.messageService.setup(m => m.get(bbctx, general.id, message.id)).thenResolve(message);
                ctx.messageService.setup(m => m.removeReactions(bbctx, general.id, message.id, ctx.users.command.id, argument.isDeepEqual([think])))
                    .thenResolve({ success: [think], failed: [] });
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;🤔}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'reactremove:requests')).verifiable(1).thenResolve(undefined);
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.userService.setup(m => m.querySingle(bbctx, otherUser.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.messageService.setup(m => m.get(bbctx, general.id, message.id)).thenResolve(message);
                ctx.messageService.setup(m => m.removeReactions(bbctx, general.id, message.id, otherUser.id, argument.isDeepEqual([think])))
                    .thenResolve({ success: [think], failed: [] });
            }
        },
        {
            code: '{reactremove;general;2938453289453240;other;abc}',
            expected: '`Invalid Emojis`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Invalid Emojis') }
            ],
            postSetup(bbctx, ctx) {
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.userService.setup(m => m.querySingle(bbctx, otherUser.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.messageService.setup(m => m.get(bbctx, general.id, message.id)).thenResolve(message);
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
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve();
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
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
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
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
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.messageService.setup(m => m.get(bbctx, general.id, '2938453289453240')).thenResolve(undefined);
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
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.messageService.setup(m => m.get(bbctx, general.id, message.id)).thenResolve(message);
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
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.userService.setup(m => m.querySingle(bbctx, otherUser.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.messageService.setup(m => m.get(bbctx, general.id, message.id)).thenResolve(message);
                ctx.messageService.setup(m => m.removeReactions(bbctx, general.id, message.id, otherUser.id, argument.isDeepEqual([think])))
                    .thenResolve({ success: [think], failed: [] });
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
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.userService.setup(m => m.querySingle(bbctx, otherUser.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve();
                ctx.messageService.setup(m => m.get(bbctx, general.id, message.id)).thenResolve(message);
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
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.userService.setup(m => m.querySingle(bbctx, otherUser.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.messageService.setup(m => m.get(bbctx, general.id, message.id)).thenResolve(message);
                ctx.messageService.setup(m => m.removeReactions(bbctx, general.id, message.id, otherUser.id, argument.isDeepEqual([fakeEmote])))
                    .verifiable(1)
                    .thenResolve({ success: [], failed: [fakeEmote] });

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
                const general = ctx.channels.general;
                const otherUser = ctx.users.other;

                const message = SubtagTestContext.createMessage({
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
                }, ctx.users.other);

                ctx.channelService.setup(m => m.querySingle(bbctx, 'general', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.channelService.setup(m => m.querySingle(bbctx, general.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(general);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other', argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.userService.setup(m => m.querySingle(bbctx, otherUser.id, argument.isDeepEqual({ noLookup: true, noErrors: true }))).thenResolve(otherUser);
                ctx.messageService.setup(m => m.get(bbctx, general.id, message.id)).thenResolve(message);
                ctx.messageService.setup(m => m.removeReactions(bbctx, general.id, message.id, otherUser.id, argument.isDeepEqual([think])))
                    .verifiable(1)
                    .thenResolve('noPerms');

            }
        }
    ]
});

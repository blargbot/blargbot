import assert from 'node:assert/strict';

import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import type { AddReactionsThunk, CheckMessageExistsThunk, GetUserPermissionsThunk } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, ReactionAddSubtag } from '@blargbot/bbtag/subtags';
import { Emote } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const unicodeEmote = Emote.parse('🤔');
const guildEmote = Emote.parse('<:notlikecat:280110565161041921>');
const addReactions = new Mock<AddReactionsThunk>({ id: 'addReactions', callable: true });
const checkMessageExists = new Mock<CheckMessageExistsThunk>({ id: 'checkMessageExists', callable: true });
const getUserPermissions = new Mock<GetUserPermissionsThunk>({ id: 'getUserPermissions', callable: true });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'channelIdSubtag' });

await runSubtagTests({
    subtag: new ReactionAddSubtag({
        addReactions: addReactions.instance,
        checkMessageExists: checkMessageExists.instance,
        getUserPermissions: getUserPermissions.instance
    }),
    argCountBounds: { min: 1, max: Infinity },
    names: ['reactionAdd', 'addReact', 'reactAdd'],
    setup(ctx) {
        ctx.adoptMock(addReactions);
        ctx.adoptMock(checkMessageExists);
        ctx.adoptMock(getUserPermissions);
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
    },
    cases: [
        {
            code: '{reactadd;🤔}',
            expected: '',
            subtags: [channelIdSubtag.instance],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noErrors: true, noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, ctx.channels.command.id))
                    .resolves(DiscordPermissions.ADD_REACTIONS)
                    .mustHappen(1);
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.root.output.reactions, ['🤔']);
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => checkMessageExists.setup(m => m(c, i)),
            notExists: Promise.resolve(false),
            emptyIsCurrentMessage: false,
            queryOptions: () => ({ noLookup: true, noErrors: true }),
            generateCode(...args) {
                return `{${['reactadd', ...args, '🤔'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    setup(getProp, channelId, messageId, ctx) {
                        getProp.resolves(true).mustHappen(1);
                        getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                            .resolves(DiscordPermissions.ADD_REACTIONS)
                            .mustHappen(1);
                        addReactions.setup((m, $) => m(channelId, messageId, $([unicodeEmote])))
                            .resolves({ success: [unicodeEmote], failed: [] })
                            .mustHappen(1);
                    }
                },
                {
                    expected: '`I dont have permission to Add Reactions`',
                    error: new BBTagRuntimeError('I dont have permission to Add Reactions'),
                    setup(getProp, channelId, _, ctx) {
                        getProp.resolves(true).mustHappen(1);
                        getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                            .resolves(DiscordPermissions.NONE)
                            .mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{reactadd;🤔<:notlikecat:280110565161041921>}',
            expected: '',
            subtags: [channelIdSubtag.instance],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noErrors: true, noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, ctx.channels.command.id))
                    .resolves(DiscordPermissions.ADD_REACTIONS)
                    .mustHappen(1);
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.root.output.reactions, ['🤔', guildEmote.toString()]);
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => checkMessageExists.setup(m => m(c, i)),
            notExists: Promise.resolve(false),
            emptyIsCurrentMessage: false,
            queryOptions: () => ({ noLookup: true, noErrors: true }),
            generateCode(...args) {
                return `{${['reactadd', ...args, '🤔<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    setup(getProp, channelId, messageId, ctx) {
                        getProp.resolves(true).mustHappen(1);
                        getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                            .resolves(DiscordPermissions.ADD_REACTIONS)
                            .mustHappen(1);
                        addReactions.setup((m, $) => m(channelId, messageId, $([unicodeEmote, guildEmote])))
                            .resolves({ success: [unicodeEmote, guildEmote], failed: [] })
                            .mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{reactadd;🤔;<:notlikecat:280110565161041921>}',
            expected: '',
            subtags: [channelIdSubtag.instance],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noErrors: true, noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, ctx.channels.command.id))
                    .resolves(DiscordPermissions.ADD_REACTIONS)
                    .mustHappen(1);
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.root.output.reactions, ['🤔', guildEmote.toString()]);
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => checkMessageExists.setup(m => m(c, i)),
            notExists: Promise.resolve(false),
            emptyIsCurrentMessage: false,
            queryOptions: () => ({ noLookup: true, noErrors: true }),
            generateCode(...args) {
                return `{${['reactadd', ...args, '🤔', '<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    setup(getProp, channelId, messageId, ctx) {
                        getProp.resolves(true).mustHappen(1);
                        getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, channelId))
                            .resolves(DiscordPermissions.ADD_REACTIONS)
                            .mustHappen(1);
                        addReactions.setup((m, $) => m(channelId, messageId, $([unicodeEmote, guildEmote])))
                            .resolves({ success: [unicodeEmote, guildEmote], failed: [] })
                            .mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{reactadd;abc;def;ghi}',
            expected: '`Invalid Emojis`',
            subtags: [channelIdSubtag.instance],
            errors: [
                { error: new BBTagRuntimeError('Invalid Emojis') }
            ],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noErrors: true, noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, ctx.channels.command.id))
                    .resolves(DiscordPermissions.ADD_REACTIONS)
                    .mustHappen(1);
            }
        },
        {
            code: '{reactadd;abc;🤔;ghi}',
            expected: '',
            subtags: [channelIdSubtag.instance],
            assert(bbctx) {
                assert.deepEqual(bbctx.root.output.reactions, ['🤔']);
            },
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noErrors: true, noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, ctx.channels.command.id))
                    .resolves(DiscordPermissions.ADD_REACTIONS)
                    .mustHappen(1);
            }
        },
        {
            code: '{reactadd;2938456469267324234;🤔}',
            expected: '`I cannot add \'🤔\' as reactions`',
            subtags: [channelIdSubtag.instance],
            errors: [
                { error: new BBTagRuntimeError('I cannot add \'🤔\' as reactions') }
            ],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noErrors: true, noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
                checkMessageExists.setup(m => m(ctx.channels.command.id, '2938456469267324234'))
                    .resolves(true)
                    .mustHappen(1);
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.bot.id, ctx.channels.command.id))
                    .resolves(DiscordPermissions.ADD_REACTIONS)
                    .mustHappen(1);
                addReactions.setup((m, $) => m(ctx.channels.command.id, '2938456469267324234', $([unicodeEmote])))
                    .resolves({ success: [], failed: [unicodeEmote] })
                    .mustHappen(1);
            }
        }
    ]
});

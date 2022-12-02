import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { ReactionAddSubtag } from '@blargbot/bbtag/subtags/message/reactionAdd.js';
import { Emote } from '@blargbot/core/Emote.js';
import { argument } from '@blargbot/test-util/mock.js';
import { expect } from 'chai';
import Eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const unicodeEmote = Emote.parse('🤔');
const guildEmote = Emote.parse('<:notlikecat:280110565161041921>');

runSubtagTests({
    subtag: new ReactionAddSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    setup(ctx) {
        ctx.roles.bot.permissions = Eris.Constants.Permissions.addReactions.toString();
    },
    cases: [
        {
            code: '{reactadd;🤔}',
            expected: '',
            assert(bbctx) {
                expect(bbctx.data.reactions).to.deep.equal(['🤔']);
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            generateCode(...args) {
                return `{${['reactadd', ...args, '🤔'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    postSetup(_, message, __, ctx) {
                        ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual([unicodeEmote]))).thenResolve({ success: [unicodeEmote], failed: [] });
                    }
                },
                {
                    expected: '`I dont have permission to Add Reactions`',
                    setup(_, __, ctx) {
                        ctx.roles.bot.permissions = '0';
                    },
                    error: new BBTagRuntimeError('I dont have permission to Add Reactions')
                }
            ]
        }),
        {
            code: '{reactadd;🤔<:notlikecat:280110565161041921>}',
            expected: '',
            setup(ctx) {
                ctx.roles.bot.permissions = Eris.Constants.Permissions.addReactions.toString();
            },
            assert(bbctx) {
                expect(bbctx.data.reactions).to.deep.equal([unicodeEmote.toString(), guildEmote.toString()]);
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            generateCode(...args) {
                return `{${['reactadd', ...args, '🤔<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    postSetup(_, message, __, ctx) {
                        ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual([unicodeEmote, guildEmote]))).thenResolve({ success: [unicodeEmote, guildEmote], failed: [] });
                    }
                }
            ]
        }),
        {
            code: '{reactadd;🤔;<:notlikecat:280110565161041921>}',
            expected: '',
            setup(ctx) {
                ctx.roles.bot.permissions = Eris.Constants.Permissions.addReactions.toString();
            },
            assert(bbctx) {
                expect(bbctx.data.reactions).to.deep.equal([unicodeEmote.toString(), guildEmote.toString()]);
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            generateCode(...args) {
                return `{${['reactadd', ...args, '🤔', '<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    postSetup(_, message, __, ctx) {
                        ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual([unicodeEmote, guildEmote]))).thenResolve({ success: [unicodeEmote, guildEmote], failed: [] });
                    }
                }
            ]
        }),
        {
            code: '{reactadd;abc;def;ghi}',
            expected: '`Invalid Emojis`',
            errors: [
                { start: 0, end: 22, error: new BBTagRuntimeError('Invalid Emojis') }
            ]
        },
        {
            code: '{reactadd;abc;🤔;ghi}',
            expected: '',
            assert(bbctx) {
                expect(bbctx.data.reactions).to.deep.equal(['🤔']);
            }
        },
        {
            code: '{reactadd;2938456469267324234;🤔}',
            expected: '`I cannot add \'🤔\' as reactions`',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938456469267324234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                ctx.util.setup(m => m.getMessage(bbctx.channel, message.id, false)).thenResolve(message);
                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual([unicodeEmote]))).thenResolve({ success: [], failed: [unicodeEmote] });
            },
            errors: [
                { start: 0, end: 33, error: new BBTagRuntimeError('I cannot add \'🤔\' as reactions') }
            ]
        }
    ]
});

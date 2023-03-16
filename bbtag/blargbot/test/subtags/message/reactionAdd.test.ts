import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { ReactionAddSubtag } from '@bbtag/blargbot/subtags';
import { Emote } from '@blargbot/discord-emote';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const think = Emote.parse('🤔');
const notLikeCat = Emote.parse('<:notlikecat:280110565161041921>');

runSubtagTests({
    subtag: Subtag.getDescriptor(ReactionAddSubtag),
    argCountBounds: { min: 1, max: Infinity },
    setupEach(ctx) {
        ctx.roles.bot.permissions = Discord.PermissionFlagsBits.AddReactions.toString();
    },
    cases: [
        {
            code: '{reactadd;🤔}',
            expected: '',
            assert(bbctx) {
                chai.expect(bbctx.runtime.outputOptions.reactions).to.deep.equal(['🤔']);
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getQueryOptions: () => ({ noErrors: true, noLookup: true }),
            generateCode(...args) {
                return `{${['reactadd', ...args, '🤔'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    postSetup(channel, message, bbctx, ctx) {
                        ctx.dependencies.messages.setup(m => m.addReactions(bbctx.runtime, channel.id, message.id, argument.isDeepEqual([think])))
                            .thenResolve({ success: [think], failed: [] });
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
                ctx.roles.bot.permissions = Discord.PermissionFlagsBits.AddReactions.toString();
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.outputOptions.reactions).to.deep.equal([think.toString(), notLikeCat.toString()]);
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getQueryOptions: () => ({ noErrors: true, noLookup: true }),
            generateCode(...args) {
                return `{${['reactadd', ...args, '🤔<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    postSetup(channel, message, bbctx, ctx) {
                        ctx.dependencies.messages.setup(m => m.addReactions(bbctx.runtime, channel.id, message.id, argument.isDeepEqual([think, notLikeCat])))
                            .thenResolve({ success: [think, notLikeCat], failed: [] });
                    }
                }
            ]
        }),
        {
            code: '{reactadd;🤔;<:notlikecat:280110565161041921>}',
            expected: '',
            setup(ctx) {
                ctx.roles.bot.permissions = Discord.PermissionFlagsBits.AddReactions.toString();
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.outputOptions.reactions).to.deep.equal([think.toString(), notLikeCat.toString()]);
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getQueryOptions: () => ({ noErrors: true, noLookup: true }),
            generateCode(...args) {
                return `{${['reactadd', ...args, '🤔', '<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '',
                    postSetup(channel, message, bbctx, ctx) {
                        ctx.dependencies.messages.setup(m => m.addReactions(bbctx.runtime, channel.id, message.id, argument.isDeepEqual([think, notLikeCat])))
                            .thenResolve({ success: [think, notLikeCat], failed: [] });
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
                chai.expect(bbctx.runtime.outputOptions.reactions).to.deep.equal(['🤔']);
            }
        },
        {
            code: '{reactadd;2938456469267324234;🤔}',
            expected: '`I cannot add \'🤔\' as reactions`',
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    id: '2938456469267324234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, ctx.channels.command.id, message.id)).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.addReactions(bbctx.runtime, ctx.channels.command.id, message.id, argument.isDeepEqual([think])))
                    .thenResolve({ success: [], failed: [think] });
            },
            errors: [
                { start: 0, end: 33, error: new BBTagRuntimeError('I cannot add \'🤔\' as reactions') }
            ]
        }
    ]
});

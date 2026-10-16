import assert from 'node:assert/strict';

import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { AddReactionsThunk } from '@blargbot/bbtag/subtags';
import { ReactionAddSubtag } from '@blargbot/bbtag/subtags';
import { Emote } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const unicodeEmote = Emote.parse('🤔');
const guildEmote = Emote.parse('<:notlikecat:280110565161041921>');
const addReactions = new Mock<AddReactionsThunk>({ id: 'addReactions', callable: true });

await runSubtagTests({
    subtag: new ReactionAddSubtag({
        addReactions: addReactions.instance
    }),
    argCountBounds: { min: 1, max: Infinity },
    names: ['reactionAdd', 'addReact', 'reactAdd'],
    setup(ctx) {
        ctx.addMock(addReactions);
        addReactions.reset();
        ctx.roles.bot.permissions = eris.Constants.Permissions.addReactions.toString();
    },
    cases: [
        {
            code: '{reactadd;🤔}',
            expected: '',
            assert(bbctx) {
                assert.deepEqual(bbctx.root.output.reactions, ['🤔']);
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
                    postSetup(_, message) {
                        addReactions.setup((m, $) => m(message.channel.id, message.id, $([unicodeEmote]))).resolves({ success: [unicodeEmote], failed: [] });
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
                ctx.roles.bot.permissions = eris.Constants.Permissions.addReactions.toString();
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.root.output.reactions, [unicodeEmote.toString(), guildEmote.toString()]);
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
                    postSetup(_, message) {
                        addReactions.setup((m, $) => m(message.channel.id, message.id, $([unicodeEmote, guildEmote]))).resolves({ success: [unicodeEmote, guildEmote], failed: [] });
                    }
                }
            ]
        }),
        {
            code: '{reactadd;🤔;<:notlikecat:280110565161041921>}',
            expected: '',
            setup(ctx) {
                ctx.roles.bot.permissions = eris.Constants.Permissions.addReactions.toString();
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.root.output.reactions, [unicodeEmote.toString(), guildEmote.toString()]);
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
                    postSetup(_, message) {
                        addReactions.setup((m, $) => m(message.channel.id, message.id, $([unicodeEmote, guildEmote]))).resolves({ success: [unicodeEmote, guildEmote], failed: [] });
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
                assert.deepEqual(bbctx.root.output.reactions, ['🤔']);
            }
        },
        {
            code: '{reactadd;2938456469267324234;🤔}',
            expected: '`I cannot add \'🤔\' as reactions`',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '2938456469267324234',
                    channel_id: bbctx.local.message.channel.id
                }, ctx.users.command));

                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, message.id, false)).resolves(message);
                addReactions.setup((m, $) => m(message.channel.id, message.id, $([unicodeEmote]))).resolves({ success: [], failed: [unicodeEmote] });
            },
            errors: [
                { start: 0, end: 33, error: new BBTagRuntimeError('I cannot add \'🤔\' as reactions') }
            ]
        }
    ]
});

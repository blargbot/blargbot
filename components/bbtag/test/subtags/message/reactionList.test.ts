import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError, MessageNotFoundError } from '@blargbot/bbtag/errors/index.js';
import { ReactionListSubtag } from '@blargbot/bbtag/subtags/message/reactionList.js';
import * as Eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ReactionListSubtag),
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{reactlist}',
            expected: '`No message found`',
            setup(ctx) {
                ctx.channels.command.id = ctx.message.channel_id = '342756834937659745634';
            },
            errors: [
                { start: 0, end: 11, error: new MessageNotFoundError('342756834937659745634', '') }
            ]
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            generateCode(...args) {
                return `{${['reactlist', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]'
                },
                {
                    expected: '["🤔","notlikecat:280110565161041921","blobdance:636729199574515732"]',
                    setup(_, message) {
                        message.reactions = [
                            {
                                emoji: { id: null, name: '🤔' },
                                count: 1,
                                me: false
                            },
                            {
                                emoji: { id: '280110565161041921', name: 'notlikecat' },
                                count: 1,
                                me: false
                            },
                            {
                                emoji: { id: '636729199574515732', name: 'blobdance', animated: true },
                                count: 1,
                                me: false
                            }
                        ];
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            generateCode(...args) {
                return `{${['reactlist', ...args, '🤔'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(channel, message, ctx) {
                        ctx.discord.setup(m => m.getMessageReaction(channel.id, message.id, '🤔', undefined, undefined, undefined)).thenResolve([]);
                    }
                },
                {
                    expected: '["23098764238493489238","32847623493687578962","29874394027843984987"]',
                    setup(channel, message, ctx) {
                        ctx.users.bot.id = '23098764238493489238';
                        ctx.users.other.id = '32847623493687578962';
                        ctx.users.command.id = '29874394027843984987';
                        const bot = ctx.createUser(ctx.users.bot);
                        const other = ctx.createUser(ctx.users.other);
                        const command = ctx.createUser(ctx.users.command);

                        ctx.discord.setup(m => m.getMessageReaction(channel.id, message.id, '🤔', undefined, undefined, undefined)).thenResolve([bot, other, command]);
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            generateCode(...args) {
                return `{${['reactlist', ...args, '🤔<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(channel, message, ctx) {
                        ctx.discord.setup(m => m.getMessageReaction(channel.id, message.id, '🤔', undefined, undefined, undefined)).thenResolve([]);
                        ctx.discord.setup(m => m.getMessageReaction(channel.id, message.id, 'notlikecat:280110565161041921', undefined, undefined, undefined)).thenResolve([]);
                    }
                },
                {
                    expected: '["23098764238493489238","32847623493687578962","29874394027843984987"]',
                    setup(channel, message, ctx) {
                        ctx.users.bot.id = '23098764238493489238';
                        ctx.users.other.id = '32847623493687578962';
                        ctx.users.command.id = '29874394027843984987';
                        const bot = ctx.createUser(ctx.users.bot);
                        const other = ctx.createUser(ctx.users.other);
                        const command = ctx.createUser(ctx.users.command);

                        ctx.discord.setup(m => m.getMessageReaction(channel.id, message.id, '🤔', undefined, undefined, undefined)).thenResolve([bot, other]);
                        ctx.discord.setup(m => m.getMessageReaction(channel.id, message.id, 'notlikecat:280110565161041921', undefined, undefined, undefined)).thenResolve([other, command]);
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            generateCode(...args) {
                return `{${['reactlist', ...args, '🤔', '<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(channel, message, ctx) {
                        ctx.discord.setup(m => m.getMessageReaction(channel.id, message.id, '🤔', undefined, undefined, undefined)).thenResolve([]);
                        ctx.discord.setup(m => m.getMessageReaction(channel.id, message.id, 'notlikecat:280110565161041921', undefined, undefined, undefined)).thenResolve([]);
                    }
                },
                {
                    expected: '["23098764238493489238","32847623493687578962","29874394027843984987"]',
                    setup(channel, message, ctx) {
                        ctx.users.bot.id = '23098764238493489238';
                        ctx.users.other.id = '32847623493687578962';
                        ctx.users.command.id = '29874394027843984987';
                        const bot = ctx.createUser(ctx.users.bot);
                        const other = ctx.createUser(ctx.users.other);
                        const command = ctx.createUser(ctx.users.command);

                        ctx.discord.setup(m => m.getMessageReaction(channel.id, message.id, '🤔', undefined, undefined, undefined)).thenResolve([bot, other]);
                        ctx.discord.setup(m => m.getMessageReaction(channel.id, message.id, 'notlikecat:280110565161041921', undefined, undefined, undefined)).thenResolve([other, command]);
                    }
                }
            ]
        }),
        {
            code: '{reactlist;92384982642323432343;def;ghi}',
            expected: '`Invalid Emojis`',
            errors: [
                { start: 0, end: 40, error: new BBTagRuntimeError('Invalid Emojis') }
            ],
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '92384982642323432343',
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                ctx.util.setup(m => m.getMessage(bbctx.channel, '92384982642323432343', true)).thenResolve(message);
            }
        },
        {
            code: '{reactlist;92384982642323432343;<:fakeemote:192612896213677963>}',
            expected: '`Unknown Emoji: <:fakeemote:192612896213677963>`',
            errors: [
                { start: 0, end: 64, error: new BBTagRuntimeError('Unknown Emoji: <:fakeemote:192612896213677963>') }
            ],
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '92384982642323432343',
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                ctx.util.setup(m => m.getMessage(bbctx.channel, '92384982642323432343', true)).thenResolve(message);
                ctx.discord.setup(m => m.getMessageReaction(ctx.channels.command.id, message.id, 'fakeemote:192612896213677963', undefined, undefined, undefined))
                    .thenReject(ctx.createRESTError(Eris.ApiError.UNKNOWN_EMOJI));
            }
        }
    ]
});

import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError, MessageNotFoundError } from '@blargbot/bbtag/errors/index.js';
import { ReactionListSubtag } from '@blargbot/bbtag/subtags/message/reactionList.js';
import { Emote } from '@blargbot/discord-emote';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const think = Emote.parse('🤔');
const notLikeCat = Emote.parse('notlikecat:280110565161041921');
const fakeEmote = Emote.parse('fakeemote:192612896213677963');

runSubtagTests({
    subtag: Subtag.getDescriptor(ReactionListSubtag),
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{reactlist}',
            expected: '`No message found`',
            setup(ctx) {
                ctx.channels.command.id = ctx.message.channel_id = '3427568349359745634';
            },
            errors: [
                { start: 0, end: 11, error: new MessageNotFoundError('3427568349359745634', '') }
            ]
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getQueryOptions: () => ({ noErrors: true, noLookup: true }),
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
            getQueryOptions: () => ({ noErrors: true, noLookup: true }),
            generateCode(...args) {
                return `{${['reactlist', ...args, '🤔'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    postSetup(channel, message, bbctx, ctx) {
                        ctx.messageService.setup(m => m.getReactors(bbctx, channel.id, message.id, argument.isDeepEqual(think)))
                            .thenResolve([]);
                    }
                },
                {
                    expected: '["23098764238493489238","32847623493687578962","29874394027843984987"]',
                    postSetup(channel, message, bbctx, ctx) {
                        ctx.users.bot.id = '23098764238493489238';
                        ctx.users.other.id = '32847623493687578962';
                        ctx.users.command.id = '29874394027843984987';

                        ctx.messageService.setup(m => m.getReactors(bbctx, channel.id, message.id, argument.isDeepEqual(think)))
                            .thenResolve([ctx.users.bot.id, ctx.users.other.id, ctx.users.command.id]);
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getQueryOptions: () => ({ noErrors: true, noLookup: true }),
            generateCode(...args) {
                return `{${['reactlist', ...args, '🤔<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    postSetup(channel, message, bbctx, ctx) {

                        ctx.messageService.setup(m => m.getReactors(bbctx, channel.id, message.id, argument.isDeepEqual(think)))
                            .thenResolve([]);
                        ctx.messageService.setup(m => m.getReactors(bbctx, channel.id, message.id, argument.isDeepEqual(notLikeCat)))
                            .thenResolve([]);
                    }
                },
                {
                    expected: '["23098764238493489238","32847623493687578962","29874394027843984987"]',
                    postSetup(channel, message, bbctx, ctx) {
                        ctx.users.bot.id = '23098764238493489238';
                        ctx.users.other.id = '32847623493687578962';
                        ctx.users.command.id = '29874394027843984987';

                        ctx.messageService.setup(m => m.getReactors(bbctx, channel.id, message.id, argument.isDeepEqual(think)))
                            .thenResolve([ctx.users.bot.id, ctx.users.other.id]);
                        ctx.messageService.setup(m => m.getReactors(bbctx, channel.id, message.id, argument.isDeepEqual(notLikeCat)))
                            .thenResolve([ctx.users.other.id, ctx.users.command.id]);
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getQueryOptions: () => ({ noErrors: true, noLookup: true }),
            generateCode(...args) {
                return `{${['reactlist', ...args, '🤔', '<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    postSetup(channel, message, bbctx, ctx) {
                        ctx.messageService.setup(m => m.getReactors(bbctx, channel.id, message.id, argument.isDeepEqual(think)))
                            .thenResolve([]);
                        ctx.messageService.setup(m => m.getReactors(bbctx, channel.id, message.id, argument.isDeepEqual(notLikeCat)))
                            .thenResolve([]);
                    }
                },
                {
                    expected: '["23098764238493489238","32847623493687578962","29874394027843984987"]',
                    postSetup(channel, message, bbctx, ctx) {
                        ctx.users.bot.id = '23098764238493489238';
                        ctx.users.other.id = '32847623493687578962';
                        ctx.users.command.id = '29874394027843984987';

                        ctx.messageService.setup(m => m.getReactors(bbctx, channel.id, message.id, argument.isDeepEqual(think)))
                            .thenResolve([ctx.users.bot.id, ctx.users.other.id]);
                        ctx.messageService.setup(m => m.getReactors(bbctx, channel.id, message.id, argument.isDeepEqual(notLikeCat)))
                            .thenResolve([ctx.users.other.id, ctx.users.command.id]);
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
                const message = SubtagTestContext.createMessage({
                    id: '92384982642323432343',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                ctx.messageService.setup(m => m.get(bbctx, ctx.channels.command.id, '92384982642323432343'))
                    .thenResolve(message);
            }
        },
        {
            code: '{reactlist;92384982642323432343;<:fakeemote:192612896213677963>}',
            expected: '`Unknown Emoji: <:fakeemote:192612896213677963>`',
            errors: [
                { start: 0, end: 64, error: new BBTagRuntimeError('Unknown Emoji: <:fakeemote:192612896213677963>') }
            ],
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    id: '92384982642323432343',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                ctx.messageService.setup(m => m.get(bbctx, ctx.channels.command.id, '92384982642323432343'))
                    .thenResolve(message);
                ctx.messageService.setup(m => m.getReactors(bbctx, ctx.channels.command.id, message.id, argument.isDeepEqual(fakeEmote)))
                    .thenResolve('unknownEmote');
            }
        }
    ]
});

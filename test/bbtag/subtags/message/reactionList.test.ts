import { BBTagRuntimeError, MessageNotFoundError } from '@blargbot/bbtag';
import type { ListMessageReactionsThunk, ListMessageReactionUsersThunk } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, ReactionListSubtag } from '@blargbot/bbtag/subtags';
import { Emote } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const listMessageReactions = new Mock<ListMessageReactionsThunk>({ id: 'listMessageReactions', callable: true });
const listMessageReactionUsers = new Mock<ListMessageReactionUsersThunk>({ id: 'listMessageReactionUsers', callable: true });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'channelIdSubtag' });

await runSubtagTests({
    subtag: new ReactionListSubtag({
        listMessageReactions: listMessageReactions.instance,
        listMessageReactionUsers: listMessageReactionUsers.instance
    }),
    argCountBounds: { min: 0, max: Infinity },
    names: ['reactionList', 'listReact', 'reactList'],
    otherSubtags: [channelIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(listMessageReactions);
        ctx.adoptMock(listMessageReactionUsers);
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
    },
    cases: [
        {
            code: '{reactlist}',
            expected: '`No message found`',
            subtags: [channelIdSubtag.instance],
            errors: [
                { error: new MessageNotFoundError('342756834937659745634', '') }
            ],
            setup(ctx) {
                ctx.channels.command.id = ctx.message.channel_id = '342756834937659745634';
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => listMessageReactions.setup(m => m(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: () => ({ noErrors: true, noLookup: true }),
            emptyIsCurrentMessage: false,
            generateCode(...args) {
                return `{${['reactlist', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(getProp) {
                        getProp.resolves([]).mustHappen(1);
                    }
                },
                {
                    expected: '["🤔","notlikecat:280110565161041921","blobdance:636729199574515732"]',
                    setup(getProp) {
                        getProp.resolves([
                            new Emote('🤔'),
                            new Emote('notlikecat', '280110565161041921', false),
                            new Emote('blobdance', '636729199574515732', true)
                        ]).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => listMessageReactions.setup(m => m(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: () => ({ noErrors: true, noLookup: true }),
            emptyIsCurrentMessage: false,
            generateCode(...args) {
                return `{${['reactlist', ...args, '🤔'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(getProp, channelId, messageId) {
                        const emoteUsers = [
                            {
                                emote: new Emote('🤔'),
                                userIds: []
                            }
                        ];
                        getProp.resolves(emoteUsers.map(x => x.emote)).mustHappen(1);
                        for (const { emote, userIds } of emoteUsers) {
                            listMessageReactionUsers.setup((m, $) => m(channelId, messageId, $(emote)))
                                .resolves(userIds)
                                .mustHappen(1);
                        }
                    }
                },
                {
                    expected: '["23098764238493489238","32847623493687578962","29874394027843984987"]',
                    setup(getProp, channelId, messageId) {
                        const emoteUsers = [
                            {
                                emote: new Emote('🤔'),
                                userIds: [
                                    '23098764238493489238',
                                    '32847623493687578962',
                                    '29874394027843984987'
                                ]
                            }
                        ];
                        getProp.resolves(emoteUsers.map(x => x.emote)).mustHappen(1);
                        for (const { emote, userIds } of emoteUsers) {
                            listMessageReactionUsers.setup((m, $) => m(channelId, messageId, $(emote)))
                                .resolves(userIds)
                                .mustHappen(1);
                        }
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => listMessageReactions.setup(m => m(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: () => ({ noErrors: true, noLookup: true }),
            emptyIsCurrentMessage: false,
            generateCode(...args) {
                return `{${['reactlist', ...args, '🤔<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(getProp, channelId, messageId) {
                        const emoteUsers = [
                            {
                                emote: new Emote('🤔'),
                                userIds: []
                            },
                            {
                                emote: new Emote('notlikecat', '280110565161041921'),
                                userIds: []
                            }
                        ];
                        getProp.resolves(emoteUsers.map(x => x.emote)).mustHappen(1);
                        for (const { emote, userIds } of emoteUsers) {
                            listMessageReactionUsers.setup((m, $) => m(channelId, messageId, $(emote)))
                                .resolves(userIds)
                                .mustHappen(1);
                        }
                    }
                },
                {
                    expected: '["23098764238493489238","32847623493687578962","29874394027843984987"]',
                    setup(getProp, channelId, messageId) {
                        const emoteUsers = [
                            {
                                emote: new Emote('🤔'),
                                userIds: ['23098764238493489238', '32847623493687578962']
                            },
                            {
                                emote: new Emote('notlikecat', '280110565161041921'),
                                userIds: ['23098764238493489238', '29874394027843984987']
                            }
                        ];
                        getProp.resolves(emoteUsers.map(x => x.emote)).mustHappen(1);
                        for (const { emote, userIds } of emoteUsers) {
                            listMessageReactionUsers.setup((m, $) => m(channelId, messageId, $(emote)))
                                .resolves(userIds)
                                .mustHappen(1);
                        }
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => listMessageReactions.setup(m => m(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: () => ({ noErrors: true, noLookup: true }),
            emptyIsCurrentMessage: false,
            generateCode(...args) {
                return `{${['reactlist', ...args, '🤔', '<:notlikecat:280110565161041921>'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(getProp, channelId, messageId) {
                        const emoteUsers = [
                            {
                                emote: new Emote('🤔'),
                                userIds: []
                            },
                            {
                                emote: new Emote('notlikecat', '280110565161041921'),
                                userIds: []
                            }
                        ];
                        getProp.resolves(emoteUsers.map(x => x.emote)).mustHappen(1);
                        for (const { emote, userIds } of emoteUsers) {
                            listMessageReactionUsers.setup((m, $) => m(channelId, messageId, $(emote)))
                                .resolves(userIds)
                                .mustHappen(1);
                        }
                    }
                },
                {
                    expected: '["23098764238493489238","32847623493687578962","29874394027843984987"]',
                    setup(getProp, channelId, messageId) {
                        const emoteUsers = [
                            {
                                emote: new Emote('🤔'),
                                userIds: ['23098764238493489238', '32847623493687578962']
                            },
                            {
                                emote: new Emote('notlikecat', '280110565161041921'),
                                userIds: ['23098764238493489238', '29874394027843984987']
                            }
                        ];
                        getProp.resolves(emoteUsers.map(x => x.emote)).mustHappen(1);
                        for (const { emote, userIds } of emoteUsers) {
                            listMessageReactionUsers.setup((m, $) => m(channelId, messageId, $(emote)))
                                .resolves(userIds)
                                .mustHappen(1);
                        }
                    }
                }
            ]
        }),
        {
            code: '{reactlist;92384982642323432343;def;ghi}',
            expected: '`Invalid Emojis`',
            subtags: [channelIdSubtag.instance],
            errors: [
                { error: new BBTagRuntimeError('Invalid Emojis') }
            ],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noErrors: true, noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
                listMessageReactions.setup(m => m(ctx.channels.command.id, '92384982642323432343'))
                    .resolves([])
                    .mustHappen(1);
            }
        },
        {
            code: '{reactlist;92384982642323432343;<:fakeemote:192612896213677963>}',
            expected: '`Unknown Emoji: <:fakeemote:192612896213677963>`',
            errors: [
                { error: new BBTagRuntimeError('Unknown Emoji: <:fakeemote:192612896213677963>') }
            ],
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noErrors: true, noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
                listMessageReactions.setup(m => m(ctx.channels.command.id, '92384982642323432343'))
                    .resolves([])
                    .mustHappen(1);
                listMessageReactionUsers.setup((m, $) => m(ctx.channels.command.id, '92384982642323432343', $(new Emote('fakeemote', '192612896213677963'))))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});

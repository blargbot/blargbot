import { BBTagRuntimeError, MessageNotFoundError } from '@blargbot/bbtag';
import type { ListMessageReactionsFeature, ListMessageReactionUsersFeature } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, ReactionListSubtag } from '@blargbot/bbtag/subtags';
import Emote from '@blargbot/discord-emote';
import { Mock } from '@blargbot/test-util';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const features = new Mock<ListMessageReactionsFeature & ListMessageReactionUsersFeature>({ id: 'features' });
const channelIdSubtag = createMockSubtag(ChannelIdSubtag);

await runSubtagTests({
    subtag: new ReactionListSubtag(features.instance),
    argCountBounds: { min: 0, max: Infinity },
    names: ['reactionList', 'listReact', 'reactList'],
    otherSubtags: [channelIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(channelIdSubtag);
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
                ctx.channelId = ctx.channelId = '342756834937659745634';
            }
        },
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => features.setup(m => m.listMessageReactions(c, i)),
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
                            new Emote('notlikecat', 280110565161041921n, false),
                            new Emote('blobdance', 636729199574515732n, true)
                        ]).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            includeNoArgs: false,
            quiet: false,
            getProp: (c, i) => features.setup(m => m.listMessageReactions(c, i)),
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
                            features.setup((m, $) => m.listMessageReactionUsers(channelId, messageId, $(emote)))
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
                            features.setup((m, $) => m.listMessageReactionUsers(channelId, messageId, $(emote)))
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
            getProp: (c, i) => features.setup(m => m.listMessageReactions(c, i)),
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
                                emote: new Emote('notlikecat', 280110565161041921n),
                                userIds: []
                            }
                        ];
                        getProp.resolves(emoteUsers.map(x => x.emote)).mustHappen(1);
                        for (const { emote, userIds } of emoteUsers) {
                            features.setup((m, $) => m.listMessageReactionUsers(channelId, messageId, $(emote)))
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
                                emote: new Emote('notlikecat', 280110565161041921n),
                                userIds: ['23098764238493489238', '29874394027843984987']
                            }
                        ];
                        getProp.resolves(emoteUsers.map(x => x.emote)).mustHappen(1);
                        for (const { emote, userIds } of emoteUsers) {
                            features.setup((m, $) => m.listMessageReactionUsers(channelId, messageId, $(emote)))
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
            getProp: (c, i) => features.setup(m => m.listMessageReactions(c, i)),
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
                                emote: new Emote('notlikecat', 280110565161041921n),
                                userIds: []
                            }
                        ];
                        getProp.resolves(emoteUsers.map(x => x.emote)).mustHappen(1);
                        for (const { emote, userIds } of emoteUsers) {
                            features.setup((m, $) => m.listMessageReactionUsers(channelId, messageId, $(emote)))
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
                                emote: new Emote('notlikecat', 280110565161041921n),
                                userIds: ['23098764238493489238', '29874394027843984987']
                            }
                        ];
                        getProp.resolves(emoteUsers.map(x => x.emote)).mustHappen(1);
                        for (const { emote, userIds } of emoteUsers) {
                            features.setup((m, $) => m.listMessageReactionUsers(channelId, messageId, $(emote)))
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
            setup(ctx) {
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                features.setup(m => m.listMessageReactions(ctx.channelId, '92384982642323432343'))
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
            setup(ctx) {
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noErrors: true, noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                features.setup(m => m.listMessageReactions(ctx.channelId, '92384982642323432343'))
                    .resolves([])
                    .mustHappen(1);
                features.setup((m, $) => m.listMessageReactionUsers(ctx.channelId, '92384982642323432343', $(new Emote('fakeemote', 192612896213677963n))))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});

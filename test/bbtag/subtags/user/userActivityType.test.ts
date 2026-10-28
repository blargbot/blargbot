import type { GetMemberActivityTypeFeature } from '@blargbot/bbtag/subtags';
import { UserActivityTypeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';
import { ActivityType } from 'discord-api-types/v9';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetMemberActivityTypeFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserActivityTypeSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['userActivityType', 'userGameType'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['useractivitytype', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'playing',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Playing)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'listening',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Listening)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'competing',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Competing)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'custom',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Custom)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'streaming',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Streaming)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'watching',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Watching)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Type is null',
                    expected: '',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Type is undefined',
                    expected: '',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(undefined)
                            .mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['usergametype', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'playing',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Playing)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'listening',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Listening)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'competing',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Competing)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'custom',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Custom)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'streaming',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Streaming)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'watching',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(ActivityType.Watching)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Type is null',
                    expected: '',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Type is undefined',
                    expected: '',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityType(ctx.guildId, userId))
                            .resolves(undefined)
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});

import type { GetMemberActivityNameFeature } from '@blargbot/bbtag-engine/subtags';
import { UserActivitySubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetMemberActivityNameFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserActivitySubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['userActivity', 'userGame'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['usergame', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'My test game',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityName(ctx.guildId, userId))
                            .resolves('My test game')
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'Some cool music',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityName(ctx.guildId, userId))
                            .resolves('Some cool music')
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Name is null',
                    expected: 'nothing',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityName(ctx.guildId, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Name is undefined',
                    expected: 'nothing',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityName(ctx.guildId, userId))
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
                return `{${['useractivity', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'My test game',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityName(ctx.guildId, userId))
                            .resolves('My test game')
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'Some cool music',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityName(ctx.guildId, userId))
                            .resolves('Some cool music')
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Name is null',
                    expected: 'nothing',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityName(ctx.guildId, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Name is undefined',
                    expected: 'nothing',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberActivityName(ctx.guildId, userId))
                            .resolves(undefined)
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});

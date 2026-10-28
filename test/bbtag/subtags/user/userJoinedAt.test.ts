import type { GetMemberJoinTimestampFeature } from '@blargbot/bbtag/subtags';
import { UserJoinedAtSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetMemberJoinTimestampFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserJoinedAtSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['userJoinedAt'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userjoinedat', '', ...args].filter(v => v !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberJoinTimestamp(ctx.guildId, userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '2021-12-20T15:12:37+00:00',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberJoinTimestamp(ctx.guildId, userId))
                            .resolves(Temporal.Instant.from('2021-12-20T15:12:37+00:00'))
                            .mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userjoinedat', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberJoinTimestamp(ctx.guildId, userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '2021-12-20T15:12:37+00:00',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberJoinTimestamp(ctx.guildId, userId))
                            .resolves(Temporal.Instant.from('2021-12-20T15:12:37+00:00'))
                            .mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userjoinedat', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberJoinTimestamp(ctx.guildId, userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '20/12/2021',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberJoinTimestamp(ctx.guildId, userId))
                            .resolves(Temporal.Instant.from('2021-12-20T15:12:37+00:00'))
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});

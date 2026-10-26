import type { GetMemberBoostTimestampFeature } from '@blargbot/bbtag/subtags';
import { IsUserBoostingSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetMemberBoostTimestampFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new IsUserBoostingSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['isUserBoosting'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['isuserboosting', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
                            .resolves(undefined)
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});

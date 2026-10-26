import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { GetMemberBoostTimestampFeature } from '@blargbot/bbtag/subtags';
import { UserBoostDateSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetMemberBoostTimestampFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserBoostDateSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['userBoostDate'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userboostdate', '', ...args].filter(v => v !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'))
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Resolves to null',
                    expected: '`User not boosting`',
                    error: new BBTagRuntimeError('User not boosting'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Resolves to undefined',
                    expected: '`User not boosting`',
                    error: new BBTagRuntimeError('User not boosting'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
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
                return `{${['userboostdate', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'))
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Resolves to null',
                    expected: '`User not boosting`',
                    error: new BBTagRuntimeError('User not boosting'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Resolves to undefined',
                    expected: '`User not boosting`',
                    error: new BBTagRuntimeError('User not boosting'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
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
                return `{${['userboostdate', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'))
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Resolves to null',
                    expected: '`User not boosting`',
                    error: new BBTagRuntimeError('User not boosting'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberBoostTimestamp(ctx.guild.id, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    title: 'Resolves to undefined',
                    expected: '`User not boosting`',
                    error: new BBTagRuntimeError('User not boosting'),
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

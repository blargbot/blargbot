import type { GetUserCreatedTimestampFeature } from '@blargbot/bbtag/subtags';
import { UserCreatedAtSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetUserCreatedTimestampFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new UserCreatedAtSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['userCreatedAt'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{usercreatedat}',
            expected: '2021-01-01T00:00:00+00:00',
            subtags: [userIdSubtag.instance],
            postSetup(bbctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, '', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getUserCreatedTimestamp(userId))
                    .resolves(Temporal.Instant.from('2021-01-01T00:00:00+00:00'))
                    .mustHappen(1);
            }
        },
        {
            code: '{usercreatedat}',
            expected: '2021-12-18T16:42:33+00:00',
            subtags: [userIdSubtag.instance],
            postSetup(bbctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, '', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getUserCreatedTimestamp(userId))
                    .resolves(Temporal.Instant.from('2021-12-18T16:42:33+00:00'))
                    .mustHappen(1);
            }
        },
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup, global: true }),
            generateCode(...args) {
                return `{${['usercreatedat', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(userId) {
                        features.setup(m => m.getUserCreatedTimestamp(userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+00:00'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '2021-12-18T16:42:33+00:00',
                    setup(userId) {
                        features.setup(m => m.getUserCreatedTimestamp(userId))
                            .resolves(Temporal.Instant.from('2021-12-18T16:42:33+00:00'))
                            .mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup, global: true }),
            generateCode(...args) {
                return `{${['usercreatedat', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(userId) {
                        features.setup(m => m.getUserCreatedTimestamp(userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+00:00'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '18/12/2021',
                    setup(userId) {
                        features.setup(m => m.getUserCreatedTimestamp(userId))
                            .resolves(Temporal.Instant.from('2021-12-18T16:42:33+00:00'))
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});

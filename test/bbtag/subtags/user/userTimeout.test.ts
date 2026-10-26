import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { GetMemberTimeoutFeature } from '@blargbot/bbtag/subtags';
import { UserTimeoutSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetMemberTimeoutFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserTimeoutSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['userTimeout', 'memberTimedoutUntil', 'memberTimeout', 'timedoutUntil', 'userTimedoutUntil'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['usertimeout', '', ...args].filter(v => v !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '2021-12-20T15:12:37+00:00',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
                            .resolves(Temporal.Instant.from('2021-12-20T15:12:37+00:00'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
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
                return `{${['usertimeout', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '2021-12-20T15:12:37+00:00',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
                            .resolves(Temporal.Instant.from('2021-12-20T15:12:37+00:00'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
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
                return `{${['usertimeout', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
                            .resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '20/12/2021',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
                            .resolves(Temporal.Instant.from('2021-12-20T15:12:37+00:00'))
                            .mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
                            .resolves(null)
                            .mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberTimeout(ctx.guild.id, userId))
                            .resolves(undefined)
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});

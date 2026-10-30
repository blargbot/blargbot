import type { GetMemberStatusFeature } from '@blargbot/bbtag-engine/subtags';
import { UserStatusSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetMemberStatusFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserStatusSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['userStatus'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['userstatus', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'dnd',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberStatus(ctx.guildId, userId))
                            .resolves('dnd')
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'idle',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberStatus(ctx.guildId, userId))
                            .resolves('idle')
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'offline',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberStatus(ctx.guildId, userId))
                            .resolves('offline')
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'online',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberStatus(ctx.guildId, userId))
                            .resolves('online')
                            .mustHappen(1);
                    }
                },
                {
                    expected: 'offline',
                    setup(userId, ctx) {
                        features.setup(m => m.getMemberStatus(ctx.guildId, userId))
                            .resolves(undefined)
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});

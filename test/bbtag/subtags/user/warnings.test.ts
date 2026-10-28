import type { GetWarningsFeature } from '@blargbot/bbtag/subtags';
import { WarningsSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetWarningsFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new WarningsSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['warnings'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: undefined,
            queryOptions: noLookup => ({ noLookup, global: true }),
            generateCode(...args) {
                return `{${['warnings', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '0',
                    setup(userId, ctx) {
                        features.setup(m => m.getWarnings(ctx.guildId, userId)).resolves(undefined);
                    }
                },
                {
                    expected: '0',
                    setup(userId, ctx) {
                        features.setup(m => m.getWarnings(ctx.guildId, userId)).resolves(0);
                    }
                },
                {
                    expected: '1234',
                    setup(userId, ctx) {
                        features.setup(m => m.getWarnings(ctx.guildId, userId)).resolves(1234);
                    }
                }
            ]
        })
    ]
});

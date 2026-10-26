import type { CheckUserIsBotFeature } from '@blargbot/bbtag/subtags';
import { UserIsBotSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<CheckUserIsBotFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserIsBotSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['userIsBot', 'userBot'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup, global: true }),
            generateCode(...args) {
                return `{${['userisbot', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(userId) {
                        features.setup(m => m.checkUserIsBot(userId)).resolves(true).mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(userId) {
                        features.setup(m => m.checkUserIsBot(userId)).resolves(false).mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(userId) {
                        features.setup(m => m.checkUserIsBot(userId)).resolves(undefined).mustHappen(1);
                    }
                }
            ]
        })
    ]
});

import type { GetUserNameFeature } from '@blargbot/bbtag-engine/subtags';
import { UserNameSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetUserNameFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserNameSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['userName'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup, global: true }),
            generateCode(...args) {
                return `{${['username', ...args].join(';')}}`;
            },
            cases: [
                {
                    queryString: '09876509876543211234',
                    expected: 'abcdef',
                    setup(userId) {
                        features.setup(m => m.getUserName(userId))
                            .resolves('abcdef')
                            .mustHappen(1);
                    }
                },
                {
                    queryString: '09876509876543211234',
                    expected: 'oooh nice username',
                    setup(userId) {
                        features.setup(m => m.getUserName(userId))
                            .resolves('oooh nice username')
                            .mustHappen(1);
                    }
                }
            ]
        })
    ]
});

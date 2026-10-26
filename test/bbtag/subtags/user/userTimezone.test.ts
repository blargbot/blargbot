import type { GetUserTimezoneFeature } from '@blargbot/bbtag/subtags';
import { UserTimezoneSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<GetUserTimezoneFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserTimezoneSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['userTimeZone'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup, global: true }),
            generateCode(...args) {
                return `{${['usertimezone', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'UTC',
                    setup(userId) {
                        features.setup(m => m.getUserTimezone(userId)).resolves(undefined);
                    }
                },
                {
                    expected: 'abc',
                    setup(userId) {
                        features.setup(m => m.getUserTimezone(userId)).resolves('abc');
                    }
                },
                {
                    expected: 'Etc/UTC',
                    setup(userId) {
                        features.setup(m => m.getUserTimezone(userId)).resolves('Etc/UTC');
                    }
                }
            ]
        })
    ]
});

import { UserDiscriminatorSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    subtag: new UserDiscriminatorSubtag(),
    argCountBounds: { min: 0, max: 2 },
    names: ['userDiscrim', 'userDiscriminator'],
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup, global: true }),
            generateCode(...args) {
                return `{${['userdiscrim', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '0000'
                }
            ]
        })
    ]
});

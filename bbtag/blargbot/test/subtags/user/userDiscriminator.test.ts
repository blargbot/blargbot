import { UserDiscriminatorSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: UserDiscriminatorSubtag,
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['userdiscrim', ...args].join(';')}}`;
            },
            getQueryOptions: q => ({ noLookup: q }),
            cases: [
                {
                    expected: '1234',
                    setup(member) {
                        member.discriminator = '1234';
                    }
                },
                {
                    expected: '5678',
                    setup(member) {
                        member.discriminator = '5678';
                    }
                },
                {
                    expected: '0000',
                    setup(member) {
                        member.discriminator = '0000';
                    }
                }
            ]
        })
    ]
});

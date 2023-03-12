import { Subtag } from '@bbtag/blargbot';
import { UserNameSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserNameSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['username', ...args].join(';')}}`;
            },
            cases: [
                {
                    queryString: '09876509876543211234',
                    expected: 'abcdef',
                    setup(member) {
                        member.id = '09876509876543211234';
                        member.username = 'abcdef';
                    }
                },
                {
                    queryString: '09876509876543211234',
                    expected: 'oooh nice username',
                    setup(member) {
                        member.id = '09876509876543211234';
                        member.username = 'oooh nice username';
                    }
                }
            ]
        })
    ]
});

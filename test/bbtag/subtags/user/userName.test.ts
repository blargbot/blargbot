import { UserNameSubtag } from '@blargbot/bbtag/subtags/user/userName.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: new UserNameSubtag(),
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
                        member.user.id = '09876509876543211234';
                        member.user.username = 'abcdef';
                    }
                },
                {
                    queryString: '09876509876543211234',
                    expected: 'oooh nice username',
                    setup(member) {
                        member.user.id = '09876509876543211234';
                        member.user.username = 'oooh nice username';
                    }
                }
            ]
        })
    ]
});

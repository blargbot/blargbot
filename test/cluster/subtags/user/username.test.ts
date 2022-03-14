import { UserNameSubtag } from '@cluster/subtags/user/username';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

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

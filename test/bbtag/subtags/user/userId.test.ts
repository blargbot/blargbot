import { UserIdSubtag } from '@blargbot/bbtag/subtags/user/userId.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: new UserIdSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['userid', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '12345678900987236',
                    setup(member) {
                        member.user.id = '12345678900987236';
                    }
                },
                {
                    expected: '098765434512212678',
                    setup(member) {
                        member.user.id = '098765434512212678';
                    }
                },
                {
                    expected: '876543456782978367654',
                    setup(member) {
                        member.user.id = '876543456782978367654';
                    }
                }
            ]
        })
    ]
});

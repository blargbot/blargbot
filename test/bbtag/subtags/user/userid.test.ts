import { UserIdSubtag } from '@blargbot/bbtag/subtags/user/userid';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserIdSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: ``,
            generateCode(...args) {
                return `{${[`userid`, ...args].join(`;`)}}`;
            },
            cases: [
                {
                    expected: `12345678900987236`,
                    setup(member) {
                        member.user.id = `12345678900987236`;
                    }
                },
                {
                    expected: `098765434512212678`,
                    setup(member) {
                        member.user.id = `098765434512212678`;
                    }
                },
                {
                    expected: `876543456782978367654`,
                    setup(member) {
                        member.user.id = `876543456782978367654`;
                    }
                }
            ]
        })
    ]
});

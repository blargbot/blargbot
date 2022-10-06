import { UserRolesSubtag } from '@blargbot/bbtag/subtags/user/userroles';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserRolesSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: ``,
            generateCode(...args) {
                return `{${[`userroles`, ...args].join(`;`)}}`;
            },
            cases: [
                {
                    expected: `[]`,
                    setup(member) {
                        member.roles = [];
                    }
                },
                {
                    expected: `["098765434512212678"]`,
                    setup(member) {
                        member.roles = [`098765434512212678`];
                    }
                },
                {
                    expected: `["098765434512212678","1234567890987654"]`,
                    setup(member) {
                        member.roles = [`098765434512212678`, `1234567890987654`];
                    }
                }
            ]
        })
    ]
});

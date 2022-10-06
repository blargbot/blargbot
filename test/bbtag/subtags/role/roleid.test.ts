import { RoleIdSubtag } from '@blargbot/bbtag/subtags/role/roleid';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetRolePropTestCases } from './_getRolePropTest';

runSubtagTests({
    subtag: new RoleIdSubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: ``,
            generateCode(...args) {
                return `{${[`roleid`, ...args].join(`;`)}}`;
            },
            cases: [
                {
                    expected: `2430496204783648`,
                    setup(role) {
                        role.id = `2430496204783648`;
                    }
                }
            ]
        })
    ]
});

import { Subtag } from '@blargbot/bbtag';
import { RoleIdSubtag } from '@blargbot/bbtag/subtags/role/roleId.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RoleIdSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['roleid', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2430496204783648',
                    setup(role) {
                        role.id = '2430496204783648';
                    }
                }
            ]
        })
    ]
});

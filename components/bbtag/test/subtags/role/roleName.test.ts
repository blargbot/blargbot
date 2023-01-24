import { Subtag } from '@blargbot/bbtag';
import { RoleNameSubtag } from '@blargbot/bbtag/subtags/role/roleName.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RoleNameSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['rolename', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'abcdef',
                    setup(role) {
                        role.name = 'abcdef';
                    }
                }
            ]
        })
    ]
});

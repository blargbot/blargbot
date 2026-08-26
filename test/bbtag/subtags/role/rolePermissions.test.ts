import { RolePermissionsSubtag } from '@blargbot/bbtag/subtags/role/rolePermissions.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: new RolePermissionsSubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['roleperms', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '23178324',
                    setup(role) {
                        role.permissions = '23178324';
                    }
                }
            ]
        })
    ]
});

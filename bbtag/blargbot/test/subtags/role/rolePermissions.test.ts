import { RolePermissionsSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: RolePermissionsSubtag,
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

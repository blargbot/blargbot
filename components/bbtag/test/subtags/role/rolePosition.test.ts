import { Subtag } from '@blargbot/bbtag';
import { RolePositionSubtag } from '@blargbot/bbtag/subtags/role/rolePosition.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RolePositionSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['rolepos', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2837643',
                    setup(role) {
                        role.position = 2837643;
                    }
                },
                {
                    expected: '0',
                    setup(role) {
                        role.position = 0;
                    }
                }
            ]
        })
    ]
});

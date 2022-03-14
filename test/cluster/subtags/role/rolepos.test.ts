import { RolePosSubtag } from '@blargbot/cluster/subtags/role/rolepos';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetRolePropTestCases } from './_getRolePropTest';

runSubtagTests({
    subtag: new RolePosSubtag(),
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

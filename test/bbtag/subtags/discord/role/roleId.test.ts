import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleIdReplacer,
    names: ['roleId'],
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['roleid', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '<a role id>',
                    setup(_, roleId) {
                        this.expected = roleId.toString();
                    }
                }
            ]
        })
    ]
});

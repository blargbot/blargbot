import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleIdReplacer,
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

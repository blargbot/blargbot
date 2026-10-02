import type { QueryDiscordUserLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userIdReplacer,
    names: ['userId'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<QueryDiscordUserLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['userid', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '<a user id>',
                    setup(_, userId) {
                        this.expected = userId.toString();
                    }
                }
            ]
        })
    ]
});

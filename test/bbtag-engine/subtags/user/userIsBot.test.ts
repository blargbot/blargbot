import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userIsBotReplacer,
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['userisbot', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(member) {
                        member.user.bot = true;
                    }
                },
                {
                    expected: 'false',
                    setup(member) {
                        member.user.bot = false;
                    }
                },
                {
                    expected: 'false',
                    setup(member) {
                        member.user.bot = undefined;
                    }
                }
            ]
        })
    ]
});

import type { DiscordUserNameLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userNameReplacer,
    names: ['userName'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<DiscordUserNameLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['username', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'abcdef',
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.getUserName(userId)).resolves('abcdef').mustHappen(1);
                    }
                },
                {
                    expected: 'oooh nice username',
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.getUserName(userId)).resolves('oooh nice username').mustHappen(1);
                    }
                }
            ]
        })
    ]
});

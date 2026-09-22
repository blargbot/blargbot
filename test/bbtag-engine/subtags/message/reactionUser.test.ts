import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.reactionUserReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{reactuser}',
            expected: '`{reactuser} can only be used inside {waitreaction}`',
            errors: [
                { start: 0, end: 11, error: new BBTagRuntimeError('{reactuser} can only be used inside {waitreaction}') }
            ]
        },
        {
            code: '{reactuser}',
            expected: '237462498437649',
            postSetup(bbctx) {
                bbctx.scopes.local.reactUser = '237462498437649';
            }
        }
    ]
});

import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.reactionReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{reaction}',
            expected: '`{reaction} can only be used inside {waitreaction}`',
            errors: [
                { start: 0, end: 10, error: new BBTagRuntimeError('{reaction} can only be used inside {waitreaction}') }
            ]
        },
        {
            code: '{reaction}',
            expected: '🤔',
            postSetup(bbctx) {
                bbctx.scopes.local.reaction = '🤔';
            }
        }
    ]
});

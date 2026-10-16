import { BBTagRuntimeError } from '@blargbot/bbtag';
import { ReactionSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ReactionSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['reaction'],
    cases: [
        {
            code: '{reaction}',
            expected: '`{reaction} can only be used inside {waitreaction}`',
            errors: [
                { error: new BBTagRuntimeError('{reaction} can only be used inside {waitreaction}') }
            ]
        },
        {
            code: '{reaction}',
            expected: '🤔',
            postSetup(bbctx) {
                bbctx.local.reaction = '🤔';
            }
        }
    ]
});

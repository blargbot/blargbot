import { BBTagRuntimeError, Subtag  } from '@blargbot/bbtag';
import { ReactionSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ReactionSubtag),
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

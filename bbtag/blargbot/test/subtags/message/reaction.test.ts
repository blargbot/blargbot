import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { ReactionSubtag } from '@bbtag/blargbot/subtags';

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
                bbctx.runtime.scopes.local.reaction = '🤔';
            }
        }
    ]
});

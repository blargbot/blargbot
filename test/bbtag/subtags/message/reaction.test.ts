import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { ReactionSubtag } from '@blargbot/bbtag/subtags/message/reaction.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new ReactionSubtag(),
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

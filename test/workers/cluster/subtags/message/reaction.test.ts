import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { ReactionSubtag } from '@cluster/subtags/message/reaction';

import { runSubtagTests } from '../SubtagTestSuite';

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

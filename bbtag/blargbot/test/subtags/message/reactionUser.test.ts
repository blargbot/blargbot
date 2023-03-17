import { BBTagRuntimeError } from '@bbtag/blargbot';
import { ReactionUserSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: ReactionUserSubtag,
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
                bbctx.runtime.scopes.local.reactUser = '237462498437649';
            }
        }
    ]
});

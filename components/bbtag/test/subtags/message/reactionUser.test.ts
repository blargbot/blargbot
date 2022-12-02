import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { ReactionUserSubtag } from '@blargbot/bbtag/subtags/message/reactionUser.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new ReactionUserSubtag(),
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

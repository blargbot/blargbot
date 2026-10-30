import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import { ReactionSubtag } from '@blargbot/bbtag-engine/subtags';

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
            setup(ctx) {
                ctx.bbtag.local.reaction = '🤔';
            }
        }
    ]
});

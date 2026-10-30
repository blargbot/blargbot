import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import { ReactionUserSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ReactionUserSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['reactionUser', 'reactUser'],
    cases: [
        {
            code: '{reactuser}',
            expected: '`{reactuser} can only be used inside {waitreaction}`',
            errors: [
                { error: new BBTagRuntimeError('{reactuser} can only be used inside {waitreaction}') }
            ]
        },
        {
            code: '{reactuser}',
            expected: '237462498437649',
            setup(ctx) {
                ctx.bbtag.local.reactUser = '237462498437649';
            }
        }
    ]
});

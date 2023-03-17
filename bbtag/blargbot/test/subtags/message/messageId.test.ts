import { MessageIdSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: MessageIdSubtag,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{messageid}',
            expected: '098765432212345678',
            setup(ctx) {
                ctx.message.id = '098765432212345678';
            }
        }
    ]
});

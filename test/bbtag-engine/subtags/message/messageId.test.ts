import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.messageIdReplacer,
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

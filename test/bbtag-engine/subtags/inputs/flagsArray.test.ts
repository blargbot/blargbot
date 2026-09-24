import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.flagsArrayReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{flagsarray}',
            expected: '["_"]',
            setup(ctx) {
                ctx.locals.setup(m => m.flags).returns({
                    _: ['some', 'more', 'text']
                });
            }
        },
        {
            code: '{flagsarray}',
            expected: '["_","a","b","c","e","E"]',
            setup(ctx) {
                ctx.locals.setup(m => m.flags).returns({
                    _: ['some', 'more', 'text'],
                    'a': ['flag', 'a', 'content'],
                    'b': [],
                    'c': ['flag', 'c', 'content'],
                    'e': ['flag', 'extra', 'content'],
                    'E': ['flag', 'else', 'content']
                });
            }
        }
    ]
});

import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.flagSetReplacer,
    argCountBounds: { min: 1, max: 1 },
    setup(ctx) {
        ctx.locals.setup(m => m.flags).returns({
            'a': ['flag', 'a', 'content'],
            'b': [],
            'c': ['flag', 'c', 'content'],
            'e': ['flag', 'extra', 'content'],
            'E': ['flag', 'else', 'content'],
            _: ['some', 'more', 'text']
        });
    },
    cases: [
        { code: '{flagset;1}', expected: 'false' },
        { code: '{flagset;a}', expected: 'true' },
        { code: '{flagset;A}', expected: 'false' },
        { code: '{flagset;b}', expected: 'true' },
        { code: '{flagset;c}', expected: 'true' },
        { code: '{flagset;d}', expected: 'false' },
        { code: '{flagset;e}', expected: 'true' },
        { code: '{flagset;E}', expected: 'true' }
    ]
});

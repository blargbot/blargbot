import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.flagReplacer,
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
        { code: '{flag;1}', expected: '' },
        { code: '{flag;a}', expected: 'flag a content' },
        { code: '{flag;A}', expected: '' },
        { code: '{flag;b}', expected: '' },
        { code: '{flag;c}', expected: 'flag c content' },
        { code: '{flag;d}', expected: '' },
        { code: '{flag;e}', expected: 'flag extra content' },
        { code: '{flag;E}', expected: 'flag else content' }
    ]
});

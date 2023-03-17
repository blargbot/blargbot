import { FlagSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: FlagSubtag,
    argCountBounds: { min: 1, max: 1 },
    setupEach(ctx) {
        ctx.entrypoint.inputRaw = 'This is some text -a flag a content -bc flag c content -- some more text --extra flag extra content --else flag else content';
        ctx.entrypoint.flags = [
            {
                flag: 'e',
                word: 'extra'
            },
            {
                flag: 'E',
                word: 'else'
            }
        ];
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

import { Subtag } from '@bbtag/blargbot';
import { FlagSetSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(FlagSetSubtag),
    argCountBounds: { min: 1, max: 1 },
    setupEach(ctx) {
        ctx.options.inputRaw = 'This is some text -a flag a content -bc flag c content -- some more text --extra flag extra content --else flag else content';
        ctx.options.flags = [
            {
                description: '',
                flag: 'e',
                word: 'extra'
            },
            {
                description: '',
                flag: 'E',
                word: 'else'
            }
        ];
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

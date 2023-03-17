import { FlagsArraySubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: FlagsArraySubtag,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{flagsarray}',
            expected: '["_"]'
        },
        {
            code: '{flagsarray}',
            expected: '["_","a","b","c","e","E"]',
            setup(ctx) {
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
            }
        }
    ]
});

import { FlagsArraySubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new FlagsArraySubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['flagsArray'],
    cases: [
        {
            code: '{flagsarray}',
            expected: '["_"]'
        },
        {
            code: '{flagsarray}',
            expected: '["_","a","b","c","e","E"]',
            setup(ctx) {
                ctx.flagDefinitions = [
                    {
                        flag: 'e',
                        word: 'extra'
                    },
                    {
                        flag: 'E',
                        word: 'else'
                    }
                ];
                ctx.input = 'This is some text -a flag a content -bc flag c content -- some more text --extra flag extra content --else flag else content';
            }
        }
    ]
});

import { Subtag } from '@blargbot/bbtag';
import { FlagsArraySubtag } from '@blargbot/bbtag/subtags/bot/flagsArray.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(FlagsArraySubtag),
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
            }
        }
    ]
});

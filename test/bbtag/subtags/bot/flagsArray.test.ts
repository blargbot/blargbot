import { FlagsArraySubtag } from '@blargbot/bbtag-engine/subtags';

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
                ctx.input.flags = {
                    _: 'This is some text some more text',
                    a: 'flag a content',
                    b: '',
                    c: 'flag c content',
                    e: 'flag extra content',
                    E: 'flag else content'
                };
            }
        }
    ]
});

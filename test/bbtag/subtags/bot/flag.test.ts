import { FlagSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new FlagSubtag(),
    argCountBounds: { min: 1, max: 1 },
    names: ['flag'],
    setup(ctx) {
        ctx.input.flags = {
            _: 'This is some text some more text',
            a: 'flag a content',
            b: '',
            c: 'flag c content',
            e: 'flag extra content',
            E: 'flag else content'
        };
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

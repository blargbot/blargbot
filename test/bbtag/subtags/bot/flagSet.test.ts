import { FlagSetSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new FlagSetSubtag(),
    argCountBounds: { min: 1, max: 1 },
    names: ['flagSet'],
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

import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.lowerReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{lower;}', expected: '' },
        { code: '{lower;AbC}', expected: 'abc' },
        { code: '{lower;This Is A Test}', expected: 'this is a test' },
        { code: '{lower;ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz}', expected: 'abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz' }
    ]
});

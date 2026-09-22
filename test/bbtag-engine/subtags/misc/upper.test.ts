import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.upperReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{upper;}', expected: '' },
        { code: '{upper;AbC}', expected: 'ABC' },
        { code: '{upper;This Is A Test}', expected: 'THIS IS A TEST' },
        { code: '{upper;ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz}', expected: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ' }
    ]
});

import { EscapeBBTagSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new EscapeBBTagSubtag(),
    argCountBounds: { min: 0, max: Infinity },
    names: ['escapeBBTag', 'escape'],
    cases: [
        { code: '{escapebbtag}', expected: '' },
        { code: '{escapebbtag;{eval}}', expected: '{eval}' },
        { code: '{escapebbtag;  { "prop": true }  }', expected: '  { "prop": true }  ' },
        { code: '{escapebbtag;{lb} this is a test; aaaaa oooo      }', expected: '{lb} this is a test; aaaaa oooo      ' }
    ]
});

import { EscapeBBTagSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: EscapeBBTagSubtag,
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        { code: '{escapebbtag}', expected: '' },
        { code: '{escapebbtag;{eval}}', expected: '{eval}' },
        { code: '{escapebbtag;  { "prop": true }  }', expected: '  { "prop": true }  ' },
        { code: '{escapebbtag;{lb} this is a test; aaaaa oooo      }', expected: '{lb} this is a test; aaaaa oooo      ' }
    ]
});

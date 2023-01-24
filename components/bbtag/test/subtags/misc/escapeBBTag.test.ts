import { Subtag } from '@blargbot/bbtag';
import { EscapeBBTagSubtag } from '@blargbot/bbtag/subtags/misc/escapeBBTag.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(EscapeBBTagSubtag),
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        { code: '{escapebbtag}', expected: '' },
        { code: '{escapebbtag;{eval}}', expected: '{eval}' },
        { code: '{escapebbtag;  { "prop": true }  }', expected: '  { "prop": true }  ' },
        { code: '{escapebbtag;{lb} this is a test; aaaaa oooo      }', expected: '{lb} this is a test; aaaaa oooo      ' }
    ]
});

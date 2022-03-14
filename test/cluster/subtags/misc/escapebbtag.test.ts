import { EscapeBbtagSubtag } from '@blargbot/cluster/subtags/misc/escapebbtag';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new EscapeBbtagSubtag(),
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        { code: '{escapebbtag}', expected: '' },
        { code: '{escapebbtag;{eval}}', expected: '{eval}' },
        { code: '{escapebbtag;  { "prop": true }  }', expected: '  { "prop": true }  ' },
        { code: '{escapebbtag;{lb} this is a test; aaaaa oooo      }', expected: '{lb} this is a test; aaaaa oooo      ' }
    ]
});

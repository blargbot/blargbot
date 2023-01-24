import { Subtag } from '@blargbot/bbtag';
import { LowerSubtag } from '@blargbot/bbtag/subtags/misc/lower.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(LowerSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{lower;}', expected: '' },
        { code: '{lower;AbC}', expected: 'abc' },
        { code: '{lower;This Is A Test}', expected: 'this is a test' },
        { code: '{lower;ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz}', expected: 'abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz' }
    ]
});

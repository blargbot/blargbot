import { Subtag } from '@bbtag/blargbot';
import { ParseFloatSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ParseFloatSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{parsefloat;123}', expected: '123' },
        { code: '{parsefloat;123.456}', expected: '123.456' },
        { code: '{parsefloat;123,456}', expected: '123.456' },
        { code: '{parsefloat;abc}', expected: 'NaN' },
        { code: '{parsefloat;123,456.789}', expected: '123456.789' },
        { code: '{parsefloat;123.456,789}', expected: '123456.789' }
    ]
});

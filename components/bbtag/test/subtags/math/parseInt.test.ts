import { ParseIntSubtag } from '@blargbot/bbtag/subtags/math/parseInt.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new ParseIntSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{parseint;123}', expected: '123' },
        { code: '{parseint;123.456}', expected: '123' },
        { code: '{parseint;123,456}', expected: '123' },
        { code: '{parseint;abc}', expected: 'NaN' },
        { code: '{parseint;123,456.789}', expected: '123456' },
        { code: '{parseint;123.456,789}', expected: '123456' }
    ]
});

import { NumberFormatSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: NumberFormatSubtag,
    argCountBounds: { min: 2, max: 4 },
    cases: [
        { code: '{numformat;123456.789;2}', expected: '123456.79' },
        { code: '{numformat;123456.789;-3}', expected: '123000' },
        { code: '{numformat;100.10000;}', expected: '100.1' },
        { code: '{numformat;3.1415;4;,}', expected: '3,1415' },
        { code: '{numformat;100000;;;.}', expected: '100.000' },
        { code: '{numformat;abc;2}', expected: 'NaN' }
    ]
});

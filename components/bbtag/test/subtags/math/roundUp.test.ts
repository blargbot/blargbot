import { NotANumberError } from '@blargbot/bbtag/errors/index.js';
import { RoundUpSubtag } from '@blargbot/bbtag/subtags/math/roundUp.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new RoundUpSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{roundup;5}', expected: '5' },
        { code: '{roundup;9.2}', expected: '10' },
        { code: '{roundup;3.6}', expected: '4' },
        { code: '{roundup;4.5}', expected: '5' },
        { code: '{roundup;22.499999}', expected: '23' },
        {
            code: '{roundup;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 13, error: new NotANumberError('abc') }
            ]
        }
    ]
});

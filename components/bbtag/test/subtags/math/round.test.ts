import { Subtag } from '@blargbot/bbtag';
import { NotANumberError } from '@blargbot/bbtag/errors/index.js';
import { RoundSubtag } from '@blargbot/bbtag/subtags/math/round.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RoundSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{round;5}', expected: '5' },
        { code: '{round;9.2}', expected: '9' },
        { code: '{round;3.6}', expected: '4' },
        { code: '{round;4.5}', expected: '5' },
        { code: '{round;22.499999}', expected: '22' },
        {
            code: '{round;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 11, error: new NotANumberError('abc') }
            ]
        }
    ]
});

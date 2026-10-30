import { NotANumberError } from '@blargbot/bbtag-engine';
import { RoundSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new RoundSubtag(),
    argCountBounds: { min: 1, max: 1 },
    names: ['round'],
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
                { error: new NotANumberError('abc') }
            ]
        }
    ]
});

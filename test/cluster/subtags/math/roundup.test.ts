import { NotANumberError } from '@blargbot/cluster/bbtag/errors';
import { RoundUpSubtag } from '@blargbot/cluster/subtags/math/roundup';

import { runSubtagTests } from '../SubtagTestSuite';

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

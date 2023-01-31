import { NotANumberError, Subtag  } from '@blargbot/bbtag';
import { RandomIntSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RandomIntSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        { code: '{randint;9}', expected: /^[0-9]$/ },
        { code: '{randint;4}', expected: /^[0-4]$/ },
        { code: '{randint;1030}', expected: /^1?[0-9]{1,3}$/ },
        { code: '{randint;1;9}', expected: /^[1-9]$/ },
        { code: '{randint;3;4}', expected: /^[3-4]$/ },
        { code: '{randint;1030;1030}', expected: '1030' },
        {
            code: '{randint;abc;1030}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 18, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{randint;6;def}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 15, error: new NotANumberError('def') }
            ]
        }
    ]
});

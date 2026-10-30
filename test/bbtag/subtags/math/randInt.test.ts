import { NotANumberError } from '@blargbot/bbtag-engine';
import { RandomIntSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new RandomIntSubtag(),
    argCountBounds: { min: 1, max: 2 },
    names: ['randomInt', 'randInt'],
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
                { error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{randint;6;def}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('def') }
            ]
        }
    ]
});

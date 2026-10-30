import { NotANumberError } from '@blargbot/bbtag-engine';
import { RoundUpSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new RoundUpSubtag(),
    argCountBounds: { min: 1, max: 1 },
    names: ['roundUp', 'ceil'],
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
                { error: new NotANumberError('abc') }
            ]
        }
    ]
});

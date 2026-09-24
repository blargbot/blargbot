import type { VariablesLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.jsonKeysReplacer,
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{jsonkeys;{j;{"abc":1,"def":2,"ghi":3}}}',
            expected: '["abc","def","ghi"]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonkeys;["a","bcd","ef"]}',
            expected: '["0","1","2"]'
        },
        {
            code: '{jsonkeys;{j;{"some":{"path":{"to":{"the":123,"answer":{}}}}}};some.path.to}',
            expected: '["the","answer"]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonkeys;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}}}',
            expected: '["n","v"]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonkeys;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}};0.test}',
            expected: '["a","b"]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonkeys;{j;{"some":{"path":{}}}};some.path.to}',
            expected: '[]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonkeys;{j;{"some":{}}};some.path.to}',
            expected: '`Cannot read property to of undefined`',
            replacers: [replacers.jsonReplacer],
            errors: [
                { start: 0, end: 39, error: new BBTagRuntimeError('Cannot read property to of undefined') }
            ]
        }
    ]
});

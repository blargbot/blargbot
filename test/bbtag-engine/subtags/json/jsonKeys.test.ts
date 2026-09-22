import { BBTagRuntimeError, JsonKeysSubtag, JsonSubtag } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.jsonKeysReplacer,
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{jsonkeys;{j;{"abc":1,"def":2,"ghi":3}}}',
            expected: '["abc","def","ghi"]',
            subtags: [replacers.jsonReplacer]
        },
        {
            code: '{jsonkeys;["a","bcd","ef"]}',
            expected: '["0","1","2"]'
        },
        {
            code: '{jsonkeys;{j;{"some":{"path":{"to":{"the":123,"answer":{}}}}}};some.path.to}',
            expected: '["the","answer"]',
            subtags: [replacers.jsonReplacer]
        },
        {
            code: '{jsonkeys;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}}}',
            expected: '["n","v"]',
            subtags: [replacers.jsonReplacer]
        },
        {
            code: '{jsonkeys;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}};0.test}',
            expected: '["a","b"]',
            subtags: [replacers.jsonReplacer]
        },
        {
            code: '{jsonkeys;{j;{"some":{"path":{}}}};some.path.to}',
            expected: '[]',
            subtags: [replacers.jsonReplacer]
        },
        {
            code: '{jsonkeys;{j;{"some":{}}};some.path.to}',
            expected: '`Cannot read property to of undefined`',
            subtags: [replacers.jsonReplacer],
            errors: [
                { start: 0, end: 39, error: new BBTagRuntimeError('Cannot read property to of undefined') }
            ]
        }
    ]
});

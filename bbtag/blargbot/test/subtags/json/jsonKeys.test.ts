import { BBTagRuntimeError } from '@bbtag/blargbot';
import { JsonKeysSubtag, JsonSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: JsonKeysSubtag,
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{jsonkeys;{j;{"abc":1,"def":2,"ghi":3}}}',
            expected: '["abc","def","ghi"]',
            subtags: [JsonSubtag]
        },
        {
            code: '{jsonkeys;["a","bcd","ef"]}',
            expected: '["0","1","2"]'
        },
        {
            code: '{jsonkeys;{j;{"some":{"path":{"to":{"the":123,"answer":{}}}}}};some.path.to}',
            expected: '["the","answer"]',
            subtags: [JsonSubtag]
        },
        {
            code: '{jsonkeys;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}}}',
            expected: '["n","v"]',
            subtags: [JsonSubtag]
        },
        {
            code: '{jsonkeys;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}};0.test}',
            expected: '["a","b"]',
            subtags: [JsonSubtag]
        },
        {
            code: '{jsonkeys;{j;{"some":{"path":{}}}};some.path.to}',
            expected: '[]',
            subtags: [JsonSubtag]
        },
        {
            code: '{jsonkeys;{j;{"some":{}}};some.path.to}',
            expected: '`Cannot read property to of undefined`',
            subtags: [JsonSubtag],
            errors: [
                { start: 0, end: 39, error: new BBTagRuntimeError('Cannot read property to of undefined') }
            ]
        }
    ]
});

import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { JsonSubtag } from '@blargbot/bbtag/subtags/json/json';
import { JsonKeysSubtag } from '@blargbot/bbtag/subtags/json/jsonkeys';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new JsonKeysSubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{jsonkeys;{j;{"abc":1,"def":2,"ghi":3}}}',
            expected: '["abc","def","ghi"]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonkeys;["a","bcd","ef"]}',
            expected: '["0","1","2"]'
        },
        {
            code: '{jsonkeys;{j;{"some":{"path":{"to":{"the":123,"answer":{}}}}}};some.path.to}',
            expected: '["the","answer"]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonkeys;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}}}',
            expected: '["n","v"]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonkeys;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}};0.test}',
            expected: '["a","b"]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonkeys;{j;{"some":{"path":{}}}};some.path.to}',
            expected: '[]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonkeys;{j;{"some":{}}};some.path.to}',
            expected: '`Cannot read property to of undefined`',
            subtags: [new JsonSubtag()],
            errors: [
                { start: 0, end: 39, error: new BBTagRuntimeError('Cannot read property to of undefined') }
            ]
        }
    ]
});

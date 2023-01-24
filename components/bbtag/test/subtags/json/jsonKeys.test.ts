import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { JsonSubtag } from '@blargbot/bbtag/subtags/json/json.js';
import { JsonKeysSubtag } from '@blargbot/bbtag/subtags/json/jsonKeys.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(JsonKeysSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{jsonkeys;{j;{"abc":1,"def":2,"ghi":3}}}',
            expected: '["abc","def","ghi"]',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonkeys;["a","bcd","ef"]}',
            expected: '["0","1","2"]'
        },
        {
            code: '{jsonkeys;{j;{"some":{"path":{"to":{"the":123,"answer":{}}}}}};some.path.to}',
            expected: '["the","answer"]',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonkeys;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}}}',
            expected: '["n","v"]',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonkeys;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}};0.test}',
            expected: '["a","b"]',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonkeys;{j;{"some":{"path":{}}}};some.path.to}',
            expected: '[]',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonkeys;{j;{"some":{}}};some.path.to}',
            expected: '`Cannot read property to of undefined`',
            subtags: [Subtag.getDescriptor(JsonSubtag)],
            errors: [
                { start: 0, end: 39, error: new BBTagRuntimeError('Cannot read property to of undefined') }
            ]
        }
    ]
});

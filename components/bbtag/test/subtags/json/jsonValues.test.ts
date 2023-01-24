import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { JsonSubtag } from '@blargbot/bbtag/subtags/json/json.js';
import { JsonValuesSubtag } from '@blargbot/bbtag/subtags/json/jsonValues.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(JsonValuesSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{jsonvalues;{j;{"abc":1,"def":2,"ghi":3}}}',
            expected: '[1,2,3]',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonvalues;["a","bcd","ef"]}',
            expected: '["a","bcd","ef"]'
        },
        {
            code: '{jsonvalues;{j;{"some":{"path":{"to":{"the":123,"answer":{}}}}}};some.path.to}',
            expected: '[123,{}]',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonvalues;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}}}',
            expected: '["abc",[{"test":{"a":0,"b":1}}]]',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonvalues;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}};0.test}',
            expected: '[0,1]',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonvalues;{j;{"some":{"path":{}}}};some.path.to}',
            expected: '[]',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonvalues;{j;{"some":{}}};some.path.to}',
            expected: '`Cannot read property to of undefined`',
            subtags: [Subtag.getDescriptor(JsonSubtag)],
            errors: [
                { start: 0, end: 41, error: new BBTagRuntimeError('Cannot read property to of undefined') }
            ]
        }
    ]
});

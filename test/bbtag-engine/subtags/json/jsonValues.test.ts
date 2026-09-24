import type { VariablesLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.jsonValuesReplacer,
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{jsonvalues;{j;{"abc":1,"def":2,"ghi":3}}}',
            expected: '[1,2,3]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonvalues;["a","bcd","ef"]}',
            expected: '["a","bcd","ef"]'
        },
        {
            code: '{jsonvalues;{j;{"some":{"path":{"to":{"the":123,"answer":{}}}}}};some.path.to}',
            expected: '[123,{}]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonvalues;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}}}',
            expected: '["abc",[{"test":{"a":0,"b":1}}]]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonvalues;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}};0.test}',
            expected: '[0,1]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonvalues;{j;{"some":{"path":{}}}};some.path.to}',
            expected: '[]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonvalues;{j;{"some":{}}};some.path.to}',
            expected: '`Cannot read property to of undefined`',
            replacers: [replacers.jsonReplacer],
            errors: [
                { start: 0, end: 41, error: new BBTagRuntimeError('Cannot read property to of undefined') }
            ]
        }
    ]
});

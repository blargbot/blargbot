import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { JsonSubtag } from '@blargbot/bbtag/subtags/json/json.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(JsonSubtag),
    argCountBounds: { min: 0, max: { count: 1, noEval: [0] } },
    cases: [
        {
            code: '{json;{"a": 5, "b": "test", "c": false, "d": null, "e": [1,"2",true,null, {}], "f":{"g":{"h":"abc"}}}}',
            expected: '{"a":5,"b":"test","c":false,"d":null,"e":[1,"2",true,null,{}],"f":{"g":{"h":"abc"}}}'
        },
        {
            code: '{json;[1,2,3,4,"abc",{}]}',
            expected: '[1,2,3,4,"abc",{}]'
        },
        {
            code: '{json;{fail}}',
            expected: '`Invalid JSON provided`',
            errors: [
                { start: 0, end: 13, error: new BBTagRuntimeError('Invalid JSON provided') }
            ]
        }
    ]
});

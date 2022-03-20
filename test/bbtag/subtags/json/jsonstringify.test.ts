import { NotANumberError } from '@blargbot/bbtag/errors';
import { JsonSubtag } from '@blargbot/bbtag/subtags/json/json';
import { JsonStringifySubtag } from '@blargbot/bbtag/subtags/json/jsonstringify';
import { SubtagVariableType } from '@blargbot/core/types';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new JsonStringifySubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{jsonstringify;{j;{}}}',
            expected: '{}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonstringify;{j;{"abc":123}}}',
            expected: `{
    "abc": 123
}`,
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonstringify;{j;{"abc":123}};2}',
            expected: `{
  "abc": 123
}`,
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonstringify;{j;{"abc":123,"def":{"ghi":[1,2,3]}}}}',
            expected: `{
    "abc": 123,
    "def": {
        "ghi": [
            1,
            2,
            3
        ]
    }
}`,
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonstringify;"abc"}',
            expected: '{}'
        },
        {
            code: '{jsonstringify;def}',
            expected: '{}'
        },
        {
            code: '{jsonstringify;123}',
            expected: '{}'
        },
        {
            code: '{jsonstringify;false}',
            expected: '{}'
        },
        {
            code: '{jsonstringify;["a","b",1,2]}',
            expected: `[
    "a",
    "b",
    1,
    2
]`
        },
        {
            code: '{jsonstringify;myVar}',
            expected: `{
    "abc": 123,
    "def": {
        "ghi": [
            1,
            2,
            3
        ]
    }
}`,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.myVar`] = { abc: 123, def: { ghi: [1, 2, 3] } };
            }
        },
        {
            code: '{jsonstringify;true;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 24, error: new NotANumberError('abc') }
            ]
        }
    ]
});

import { NotANumberError, Subtag } from '@bbtag/blargbot';
import { JsonStringifySubtag, JsonSubtag } from '@bbtag/blargbot/subtags';
import { TagVariableType } from '@bbtag/blargbot'

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(JsonStringifySubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{jsonstringify;{j;{}}}',
            expected: '{}',
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonstringify;{j;{"abc":123}}}',
            expected: `{
    "abc": 123
}`,
            subtags: [Subtag.getDescriptor(JsonSubtag)]
        },
        {
            code: '{jsonstringify;{j;{"abc":123}};2}',
            expected: `{
  "abc": 123
}`,
            subtags: [Subtag.getDescriptor(JsonSubtag)]
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
            subtags: [Subtag.getDescriptor(JsonSubtag)]
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
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'myVar' }, { abc: 123, def: { ghi: [1, 2, 3] } });
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

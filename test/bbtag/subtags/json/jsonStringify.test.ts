import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { NotANumberError } from '@blargbot/bbtag';
import { JsonStringifySubtag, JsonSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new JsonStringifySubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: 2 },
    names: ['jsonStringify', 'jStringify'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
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
            expected: '{}',
            setup() {
                variables.setup(m => m.get('"abc"')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{jsonstringify;def}',
            expected: '{}',
            setup() {
                variables.setup(m => m.get('def')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{jsonstringify;123}',
            expected: '{}',
            setup() {
                variables.setup(m => m.get('123')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{jsonstringify;false}',
            expected: '{}',
            setup() {
                variables.setup(m => m.get('false')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
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
            setup() {
                variables.setup(m => m.get('myVar')).resolves({ key: 'foo', value: { abc: 123, def: { ghi: [1, 2, 3] } } }).mustHappen(1);
            }
        },
        {
            code: '{jsonstringify;true;abc}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ]
        }
    ]
});

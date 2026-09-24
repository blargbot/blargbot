import type { VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { NotANumberError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.jsonStringifyReplacer,
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{jsonstringify;{j;{}}}',
            expected: '{}',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonstringify;{j;{"abc":123}}}',
            expected: `{
    "abc": 123
}`,
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonstringify;{j;{"abc":123}};2}',
            expected: `{
  "abc": 123
}`,
            replacers: [replacers.jsonReplacer]
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
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonstringify;"abc"}',
            expected: '{}',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('"abc"')).returns({ key: '~arrayVar', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{jsonstringify;def}',
            expected: '{}',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('def')).returns({ key: '~arrayVar', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{jsonstringify;123}',
            expected: '{}',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('123')).returns({ key: '~arrayVar', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{jsonstringify;false}',
            expected: '{}',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('false')).returns({ key: '~arrayVar', value: undefined }).mustHappen(1);
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
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('myVar')).returns({ key: '~arrayVar', value: { abc: 123, def: { ghi: [1, 2, 3] } } }).mustHappen(1);
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

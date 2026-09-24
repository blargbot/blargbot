import type { VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.jsonCleanReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{jsonclean;{j;{"test":"[]"}}}',
            expected: '{"test":[]}',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonclean;{j;{"test":"[\\"{}\\"]"}}}',
            expected: '{"test":[{}]}',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonclean;{j;["test","[\\"{}\\"]"]}}',
            expected: '["test",[{}]]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonclean;{j;{"n":"arr1","v":["abc","{\\"x\\":\\"5\\"}"]}}}',
            expected: '["abc",{"x":"5"}]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonclean;arr1}',
            expected: '[{"x":{}}]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen();
                variables.setup(m => m.get('arr1')).returns({ key: '~', value: ['{"x":"{}"}'] }).mustHappen();
            }
        },
        {
            code: '{jsonclean;obj1}',
            expected: '{"a":{"x":{}}}',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen();
                variables.setup(m => m.get('obj1')).returns({ key: '~', value: { a: '{"x":"{}"}' } }).mustHappen();
            }
        },
        {
            code: '{jsonclean;var1}',
            expected: '{"a":{"x":{}}}',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen();
                variables.setup(m => m.get('var1')).returns({ key: '~', value: '{"a":"{\\"x\\":\\"{}\\"}"}' }).mustHappen();
            }
        },
        {
            code: '{jsonclean;abc}',
            expected: '{}',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen();
                variables.setup(m => m.get('abc')).returns({ key: '~', value: undefined }).mustHappen();
            }
        }
    ]
});

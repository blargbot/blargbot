import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { JsonCleanSubtag, JsonSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new JsonCleanSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: 1 },
    names: ['jsonClean', 'jClean'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            code: '{jsonclean;{j;{"test":"[]"}}}',
            expected: '{"test":[]}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonclean;{j;{"test":"[\\"{}\\"]"}}}',
            expected: '{"test":[{}]}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonclean;{j;["test","[\\"{}\\"]"]}}',
            expected: '["test",[{}]]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonclean;{j;{"n":"arr1","v":["abc","{\\"x\\":\\"5\\"}"]}}}',
            expected: '["abc",{"x":"5"}]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonclean;arr1}',
            expected: '[{"x":{}}]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['{"x":"{}"}'] }).mustHappen(1);
            }
        },
        {
            code: '{jsonclean;obj1}',
            expected: '{"a":{"x":{}}}',
            setup() {
                variables.setup(m => m.get('obj1')).resolves({ key: 'foo', value: { a: '{"x":"{}"}' } }).mustHappen(1);
            }
        },
        {
            code: '{jsonclean;var1}',
            expected: '{"a":{"x":{}}}',
            setup() {
                variables.setup(m => m.get('var1')).resolves({ key: 'foo', value: '{"a":"{\\"x\\":\\"{}\\"}"}' }).mustHappen(1);
            }
        },
        {
            code: '{jsonclean;abc}',
            expected: '{}',
            setup() {
                variables.setup(m => m.get('abc')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        }
    ]
});

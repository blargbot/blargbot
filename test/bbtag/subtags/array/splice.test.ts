import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { NotAnArrayError, NotANumberError } from '@blargbot/bbtag';
import { GetSubtag, SpliceSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new SpliceSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 2, max: Infinity },
    names: ['splice'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{splice;arr1;0}',
            expected: '[]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 2, 3, 4, 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;1}',
            expected: '[]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 2, 3, 4, 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;1}',
            expected: '[3]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 2, 4, 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;1;3}',
            expected: '[2,3,4]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;4;3}',
            expected: '[5,6]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 2, 3, 4]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;0;a}',
            expected: '[]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 2, 'a', 3, 4, 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;!arr1;2;0;a}',
            expected: '[]',
            setup() {
                variables.setup(m => m.get('!arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('!arr1', $([1, 2, 'a', 3, 4, 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;1;a}',
            expected: '[3]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 2, 'a', 4, 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;2;a;b;c;d;e;f}',
            expected: '[3,4]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 2, 'a', 'b', 'c', 'd', 'e', 'f', 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;2;a;1;2;d;e;f}',
            expected: '[3,4]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 2, 'a', '1', '2', 'd', 'e', 'f', 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;2;a;[1,2,"d"];e;f}',
            expected: '[3,4]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 2, 'a', 1, 2, 'd', 'e', 'f', 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;2;a;[[1,2,"d"]];e;f}',
            expected: '[3,4]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $([1, 2, 'a', [1, 2, 'd'], 'e', 'f', 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;{get;arr1};2;2;a;[[1,2,"d"]];e;f}',
            expected: '[3,4]',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('foo', $([1, 2, 'a', [1, 2, 'd'], 'e', 'f', 5, 6]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{splice;[1,2,3,4,5,6];2;2;a;[[1,2,"d"]];e;f}',
            expected: '[3,4]'
        },
        {
            code: '{splice;var1;2;2;a;[[1,2,"d"]];e;f}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('var1') }
            ],
            setup() {
                variables.setup(m => m.get('var1')).resolves({ key: 'foo', value: 'abc' }).mustHappen(1);
            }
        },
        {
            code: '{splice;[1,2,3,4,5,6];abc;2;a;[[1,2,"d"]];e;f}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{splice;[1,2,3,4,5,6];2;def;a;[[1,2,"d"]];e;f}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('def') }
            ]
        }
    ]
});

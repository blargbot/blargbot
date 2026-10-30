import type { Variables, VariablesProvider } from '@blargbot/bbtag-engine';
import { NotAnArrayError } from '@blargbot/bbtag-engine';
import { GetSubtag, PushSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new PushSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 2, max: Infinity },
    names: ['push'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{push;abc;def}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('abc') }
            ],
            setup() {
                variables.setup(m => m.get('abc')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{push;var1;def}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('var1') }
            ],
            setup() {
                variables.setup(m => m.get('var1')).resolves({ key: 'foo', value: 'this is var1' }).mustHappen(1);
            }
        },
        {
            code: '{push;[1,2,3];def}',
            expected: '[1,2,3,"def"]'
        },
        {
            code: '{push;{get;arr1};def}',
            expected: '',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                variables.setup((m, $) => m.set('foo', $(['this', 'is', 'arr1', 'def']))).resolves().mustHappen(1);
            }
        },
        {
            code: '{push;arr1;def}',
            expected: '',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $(['this', 'is', 'arr1', 'def']))).resolves().mustHappen(1);
            }
        },
        {
            code: '{push;!arr1;def}',
            expected: '',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('!arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                variables.setup((m, $) => m.set('!arr1', $(['this', 'is', 'arr1', 'def']))).resolves().mustHappen(1);
            }
        },
        {
            code: '{push;[];def;ghi;123}',
            expected: '["def","ghi","123"]'
        }
    ]
});

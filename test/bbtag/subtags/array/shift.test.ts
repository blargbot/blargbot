import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { NotAnArrayError } from '@blargbot/bbtag';
import { GetSubtag, ShiftSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new ShiftSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: 1 },
    names: ['shift'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            code: '{shift;abc}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('abc') }
            ],
            setup() {
                variables.setup(m => m.get('abc')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{shift;var1}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('var1') }
            ],
            setup() {
                variables.setup(m => m.get('var1')).resolves({ key: 'foo', value: 'this is var1' }).mustHappen(1);
            }
        },
        {
            code: '{shift;[1,2,3]}',
            expected: '1'
        },
        {
            code: '{shift;{get;arr1}}',
            expected: 'this',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                variables.setup((m, $) => m.set('foo', $(['is', 'arr1']))).resolves().mustHappen(1);
            }
        },
        {
            code: '{shift;arr1}',
            expected: 'this',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $(['is', 'arr1']))).resolves().mustHappen(1);
            }
        },
        {
            code: '{shift;!arr1}',
            expected: 'this',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('!arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                variables.setup((m, $) => m.set('!arr1', $(['is', 'arr1']))).resolves().mustHappen(1);
            }
        },
        {
            code: '{shift;[]}',
            expected: ''
        }
    ]
});

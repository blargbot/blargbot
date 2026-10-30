import type { Variables, VariablesProvider } from '@blargbot/bbtag-engine';
import { NotAnArrayError, NotANumberError } from '@blargbot/bbtag-engine';
import { SliceSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new SliceSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 2, max: 3 },
    names: ['slice'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{slice;abc;0}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('abc') }
            ],
            setup() {
                variables.setup(m => m.get('abc')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{slice;[1,2,3,4];0}',
            expected: '[1,2,3,4]'
        },
        {
            code: '{slice;[1,2,3,4];2;-1}',
            expected: '[3]'
        },
        {
            code: '{slice;[1,2,3,4];1}',
            expected: '[2,3,4]'
        },
        {
            code: '{slice;[1,2,3,4];1;3}',
            expected: '[2,3]'
        },
        {
            code: '{slice;[1,2,3,4];abc;3}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{slice;[1,2,3,4];1;def}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('def') }
            ]
        },
        {
            code: '{slice;arr1;1}',
            expected: '[2,3,4]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4] }).mustHappen(1);
            }
        },
        {
            code: '{slice;arr1;1;3}',
            expected: '[2,3]',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4] }).mustHappen(1);
            }
        }
    ]
});

import type { Variables, VariablesProvider } from '@blargbot/bbtag-engine';
import { NotAnArrayError } from '@blargbot/bbtag-engine';
import { GetSubtag, JoinSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new JoinSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 2, max: 2 },
    names: ['join'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{join;a;b}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('a') }
            ],
            setup() {
                variables.setup(m => m.get('a')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        { code: '{join;[1,2,3];x}', expected: '1x2x3' },
        { code: '{join;[1];x}', expected: '1' },
        { code: '{join;["a","b","c"];_}', expected: 'a_b_c' },
        {
            code: '{join;arr1;~}',
            expected: 'this~is~arr1',
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
            }
        },
        {
            code: '{join;var1;~}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('var1') }
            ],
            setup() {
                variables.setup(m => m.get('var1')).resolves({ key: 'foo', value: 'This is var1' }).mustHappen(1);
            }
        },
        {
            code: '{join;{get;arr1};~}',
            expected: 'this~is~arr1',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
            }
        }
    ]
});

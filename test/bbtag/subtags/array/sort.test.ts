import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { GetSubtag, SortSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new SortSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: 2 },
    names: ['sort'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            code: '{sort;[2,3,0,8,7,4,8,9,2,4,3]}',
            expected: '[0,2,2,3,3,4,4,7,8,8,9]'
        },
        {
            code: '{sort;["as","dlah","j","","fliuka","ufhea","uik"]}',
            expected: '["","as","dlah","fliuka","j","ufhea","uik"]'
        },
        {
            code: '{sort;[2,3,0,8,7,4,8,9,2,4,3];false}',
            expected: '[0,2,2,3,3,4,4,7,8,8,9]'
        },
        {
            code: '{sort;["as","dlah","j","","fliuka","ufhea","uik"];false}',
            expected: '["","as","dlah","fliuka","j","ufhea","uik"]'
        },
        {
            code: '{sort;[2,3,0,8,7,4,8,9,2,4,3];true}',
            expected: '[9,8,8,7,4,4,3,3,2,2,0]'
        },
        {
            code: '{sort;["as","dlah","j","","fliuka","ufhea","uik"];true}',
            expected: '["uik","ufhea","j","fliuka","dlah","as",""]'
        },
        {
            code: '{sort;[2,3,0,8,7,4,8,9,2,4,3];not a bool}',
            expected: '[9,8,8,7,4,4,3,3,2,2,0]'
        },
        {
            code: '{sort;["as","dlah","j","","fliuka","ufhea","uik"];not a bool}',
            expected: '["uik","ufhea","j","fliuka","dlah","as",""]'
        },

        {
            code: '{sort;{get;arr1}}',
            expected: '',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                variables.setup((m, $) => m.set('foo', $(['arr1', 'is', 'this']))).resolves().mustHappen(1);
            }
        },
        {
            code: '{sort;arr1}',
            expected: '',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                variables.setup((m, $) => m.set('arr1', $(['arr1', 'is', 'this']))).resolves().mustHappen(1);
            }
        },
        {
            code: '{sort;!arr1}',
            expected: '',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('!arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                variables.setup((m, $) => m.set('!arr1', $(['arr1', 'is', 'this']))).resolves().mustHappen(1);
            }
        }
    ]
});

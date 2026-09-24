import type { VariableStore } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.sortReplacer,
    argCountBounds: { min: 1, max: 2 },
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
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: ['this', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$arr1', $(['arr1', 'is', 'this']))).returns().mustHappen();
            }
        },
        {
            code: '{sort;arr1}',
            expected: '',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: ['this', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$arr1', $(['arr1', 'is', 'this']))).returns().mustHappen();
            }
        },
        {
            code: '{sort;!arr1}',
            expected: '',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('!arr1')).returns({ key: '$arr1', value: ['this', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$arr1', $(['arr1', 'is', 'this']))).returns().mustHappen();
            }
        }
    ]
});

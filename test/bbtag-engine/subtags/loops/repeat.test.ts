import type { VariableStore } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, NotANumberError, replacers } from '@blargbot/bbtag-engine';

import { setupVariables } from '../setupVariables.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.repeatReplacer,
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    cases: [
        {
            code: '{repeat;abc;10}',
            expected: 'abcabcabcabcabcabcabcabcabcabc'
        },
        {
            code: '{repeat;{increment;index},;8}',
            expected: '1,2,3,4,5,6,7,8,',
            replacers: [replacers.incrementReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupVariables(variables, 'index', 0);
                for (let i = 1; i < 9; i++)
                    variables.setup(m => m.set('index', i)).mustHappen(1);
                variables.setup(m => m.get('index')).mustHappen(8);
            }
        },
        {
            code: '{repeat;{fail};abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 19, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{repeat;{fail};-1}',
            expected: '`Can\'t be negative`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('Can\'t be negative') }
            ]
        },
        {
            code: '{repeat;{increment;index}{if;{get;index};==;6;{return}},;10}',
            expected: '1,2,3,4,5,6',
            replacers: [replacers.getReplacer, replacers.ifReplacer, replacers.returnReplacer, replacers.incrementReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupVariables(variables, 'index', 0);
                for (let i = 1; i < 7; i++)
                    variables.setup(m => m.set('index', i)).mustHappen(1);
                variables.setup(m => m.get('index')).mustHappen(12);
            }
        }
        // TODO: Move this test once limits are reintroduced
        // {
        //     code: '{repeat;{increment;index},;10}',
        //     expected: '1,2,3,4,`Too many loops`',
        //     errors: [
        //         { start: 0, end: 30, error: new BBTagRuntimeError('Too many loops') }
        //     ],
        //     replacers: [replacers.incrementReplacer],
        //     setup(ctx) {
        //         ctx.options.tagName = 'testTag';
        //         ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
        //     },
        //     postSetup(bbctx, ctx) {
        //         let i = 0;
        //         ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(5).thenCall(() => {
        //             if (i++ >= 4)
        //                 throw new BBTagRuntimeError('Too many loops');
        //             return undefined;
        //         });
        //     },
        //     async assert(bbctx, _, ctx) {
        //         assert.equal((await bbctx.variables.get('index')).value, 4);
        //         assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 4);
        //     }
        // }
    ]
});

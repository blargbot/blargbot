import type { VariableStore } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { setupArray } from '../setupArray.js';
import { setupVariables } from '../setupVariables.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.mapReplacer,
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    cases: [
        {
            code: '{map;a;b;c{fail}}',
            expected: '[]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupArray(variables, 'a', 'b', undefined, []);
            }
        },
        {
            code: '{map;a;arr1;<{get;a}>}',
            expected: '["<this>","<is>","<arr1>"]',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupArray(variables, 'a', 'arr1', ['this', 'is', 'arr1'], ['this', 'is', 'arr1']);
            }
        },
        {
            code: '{map;a;{get;arr1};<{get;a}>}',
            expected: '["<this>","<is>","<arr1>"]',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupArray(variables, 'a', 'arr1', ['this', 'is', 'arr1'], ['this', 'is', 'arr1']);
            }
        },
        {
            code: '{map;a;var1;<{get;a}>}',
            expected: '["<t>","<h>","<i>","<s>","< >","<i>","<s>","< >","<v>","<a>","<r>","<1>"]',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupVariables(variables, 'a');
                setupArray(variables, 'a', 'var1', 'this is var1', 'this is var1'.split(''));
            }
        },
        {
            code: '{map;a;var1;<{get;a}>{if;{get;a};==;s;{return}}}',
            expected: '["<t>","<h>","<i>","<s>"]',
            replacers: [replacers.getReplacer, replacers.ifReplacer, replacers.returnReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupVariables(variables, 'a');
                setupArray(variables, 'a', 'var1', 'this is var1', 'this'.split(''));
            }
        }
        // TODO: Move this test once limits are reintroduced
        // {
        //     code: '{map;a;{get;arr1};<{get;a}>}',
        //     expected: '["<this>","`Too many loops`"]',
        //     errors: [
        //         { start: 0, end: 28, error: new BBTagRuntimeError('Too many loops') }
        //     ],
        //     replacers: [replacers.getReplacer],
        //     setup(ctx) {
        //         ctx.options.tagName = 'testTag';
        //         ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
        //         ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
        //     },
        //     postSetup(bbctx, ctx) {
        //         let i = 0;
        //         ctx.limit.setup(m => m.check(bbctx, 'map:loops')).verifiable(2).thenCall(() => {
        //             if (i++ >= 1)
        //                 throw new BBTagRuntimeError('Too many loops');
        //             return undefined;
        //         });
        //     },
        //     async assert(bbctx, _, ctx) {
        //         assert.equal((await bbctx.variables.get('a')).value, 'initial');
        //         assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
        //     }
        // }
    ]
});

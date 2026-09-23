import type { VariableStore } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';
import type { Mock } from '@blargbot/test-util';

import { setupVariables } from '../setupVariables.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.whileReplacer,
    argCountBounds: { min: { count: 2, noEval: [0, 1] }, max: { count: 4, noEval: [0, 1, 2, 3] } },
    cases: [
        {
            code: '{while;{<;{get;index};10};{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            replacers: [replacers.getReplacer, replacers.incrementReplacer, replacers.operatorReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupWileNudge(variables, 0, 'index', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2);
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            replacers: [replacers.getReplacer, replacers.incrementReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupWileNudge(variables, 0, 'index', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2);
            }
        },
        {
            code: '{while;<;{get;index};10;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            replacers: [replacers.getReplacer, replacers.incrementReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupWileNudge(variables, 0, 'index', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2);
            }
        },
        {
            code: '{while;{get;index};10;<;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            replacers: [replacers.getReplacer, replacers.incrementReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupWileNudge(variables, 0, 'index', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2);
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index;2},}',
            expected: '2,4,6,8,10,',
            replacers: [replacers.getReplacer, replacers.incrementReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupWileNudge(variables, 0, 'index', [2, 4, 6, 8, 10], 2);
            }
        },
        {
            code: '{while;{get;index};>;0;{decrement;index},}',
            expected: '9,8,7,6,5,4,3,2,1,0,',
            replacers: [replacers.getReplacer, replacers.decrementReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupWileNudge(variables, 10, 'index', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 2);
            }
        },
        {
            code: '{while;{get;index};<;513;{get;index},{set;index;{*;{get;index};2}}}',
            expected: '1,2,4,8,16,32,64,128,256,512,',
            replacers: [replacers.getReplacer, replacers.setReplacer, replacers.operatorReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupWileNudge(variables, 1, 'index', ['2', '4', '8', '16', '32', '64', '128', '256', '512', '1024'], 3);
            }
        },
        // TODO: Move this test once limits are reintroduced
        // {
        //     code: '{while;{get;index};<;10;{increment;index},}',
        //     expected: '1,2,3,4,`Too many loops`',
        //     errors: [
        //         { start: 0, end: 43, error: new BBTagRuntimeError('Too many loops') }
        //     ],
        //     replacers: [replacers.getReplacer, replacers.incrementReplacer],
        //     setup(ctx) {
        //         ctx.options.tagName = 'testTag';
        //         ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
        //     },
        //     postSetup(bbctx, ctx) {
        //         let i = 0;
        //         ctx.limit.setup(m => m.check(bbctx, 'while:loops')).verifiable(5).thenCall(() => {
        //             if (i++ >= 4)
        //                 throw new BBTagRuntimeError('Too many loops');
        //             return undefined;
        //         });
        //     },
        //     async assert(bbctx, _, ctx) {
        //         assert.equal((await bbctx.variables.get('index')).value, 4);
        //         assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 4);
        //     }
        // },
        // {
        //     code: '{while;abc;def;ghi;{increment;index},}',
        //     expected: '1,2,3,4,`Too many loops`',
        //     errors: [
        //         { start: 0, end: 38, error: new BBTagRuntimeError('Too many loops') }
        //     ],
        //     replacers: [replacers.getReplacer, replacers.incrementReplacer],
        //     setup(ctx) {
        //         ctx.options.tagName = 'testTag';
        //         ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
        //     },
        //     postSetup(bbctx, ctx) {
        //         let i = 0;
        //         ctx.limit.setup(m => m.check(bbctx, 'while:loops')).verifiable(5).thenCall(() => {
        //             if (i++ >= 4)
        //                 throw new BBTagRuntimeError('Too many loops');
        //             return undefined;
        //         });
        //     },
        //     async assert(bbctx, _, ctx) {
        //         assert.equal((await bbctx.variables.get('index')).value, 4);
        //         assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 4);
        //     }
        // },
        // {
        //     code: '{while;true;{increment;index},}',
        //     expected: '1,2,3,4,`Too many loops`',
        //     errors: [
        //         { start: 0, end: 31, error: new BBTagRuntimeError('Too many loops') }
        //     ],
        //     replacers: [replacers.getReplacer, replacers.incrementReplacer],
        //     setup(ctx) {
        //         ctx.options.tagName = 'testTag';
        //         ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
        //     },
        //     postSetup(bbctx, ctx) {
        //         let i = 0;
        //         ctx.limit.setup(m => m.check(bbctx, 'while:loops')).verifiable(5).thenCall(() => {
        //             if (i++ >= 4)
        //                 throw new BBTagRuntimeError('Too many loops');
        //             return undefined;
        //         });
        //     },
        //     async assert(bbctx, _, ctx) {
        //         assert.equal((await bbctx.variables.get('index')).value, 4);
        //         assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 4);
        //     }
        // },
        {
            code: '{while;{get;index};<;10;{increment;index}{if;{get;index};==;6;{return}},}',
            expected: '1,2,3,4,5,6',
            replacers: [replacers.getReplacer, replacers.ifReplacer, replacers.returnReplacer, replacers.incrementReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupWileNudge(variables, 0, 'index', [1, 2, 3, 4, 5, 6], 3, 0);
            }
        }
    ]
});

function setupWileNudge(variables: Mock<VariableStore>, startAt: number, name: string, setValues: Array<undefined | JValue>, getPerSet: number, getOffset = 1): void {
    setupVariables(variables, name, startAt);
    for (const value of new Set(setValues))
        variables.setup(m => m.set(name, value)).mustHappen(setValues.filter(x => x === value).length);
    variables.setup(m => m.get(name)).mustHappen(getOffset + getPerSet * setValues.length);
}

import type { VariableStore } from '@blargbot/bbtag-engine';
import { AggregateBBTagError, BBTagRuntimeError, InvalidOperatorError, NotANumberError, replacers } from '@blargbot/bbtag-engine';
import type { Mock } from '@blargbot/test-util';

import { setupVariables } from '../setupVariables.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.forReplacer,
    argCountBounds: { min: { count: 5, noEval: [4] }, max: { count: 6, noEval: [5] } },
    cases: [
        {
            code: '{for;index;0;<;10;{get;index},}',
            expected: '0,1,2,3,4,5,6,7,8,9,',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupIndexes(variables, 'index', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            }
        },
        {
            code: '{for;index;0;<;10;2;{get;index},}',
            expected: '0,2,4,6,8,',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupIndexes(variables, 'index', [0, 2, 4, 6, 8]);
            }
        },
        {
            code: '{for;index;10;>;0;-1;{get;index},}',
            expected: '10,9,8,7,6,5,4,3,2,1,',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupIndexes(variables, 'index', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            }
        },
        {
            code: '{for;index;1;<;513;0;{get;index},{set;index;{*;{get;index};2}}}',
            expected: '1,2,4,8,16,32,64,128,256,512,',
            replacers: [replacers.getReplacer, replacers.setReplacer, replacers.operatorReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupIndexes(variables, 'index', [1, 2, 4, 8, 16, 32, 64, 128, 256, 512], 2);
                for (const value of [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024])
                    variables.setup(m => m.set('index', `${value}`)).mustHappen(1);
            }
        },
        {
            code: '{for;index;1;<;10;{set;index;abc}xyz}',
            expected: 'xyz`Not a number`',
            errors: [
                { start: 0, end: 37, error: new NotANumberError('abc') }
            ],
            replacers: [replacers.setReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupVariables(variables, 'index');
                variables.setup(m => m.set('index', 1)).mustHappen(1);
                variables.setup(m => m.set('index', 'abc')).mustHappen(1);
                variables.setup(m => m.get('index')).mustHappen(1);
                variables.setup((m, $) => m.rollback($.looksLike(['index']))).returns().mustHappen(1);
            }
        },
        {
            code: '{for;index;abc;<;10;1;{fail}}',
            expected: '`Initial must be a number`',
            errors: [
                { start: 0, end: 29, error: new AggregateBBTagError([new BBTagRuntimeError('Initial must be a number')]) }
            ]
        },
        {
            code: '{for;index;0;abc;10;1;{fail}}',
            expected: '`Invalid operator`',
            errors: [
                { start: 0, end: 29, error: new AggregateBBTagError([new InvalidOperatorError('abc')]) }
            ]
        },
        {
            code: '{for;index;0;<;abc;1;{fail}}',
            expected: '`Limit must be a number`',
            errors: [
                { start: 0, end: 28, error: new AggregateBBTagError([new BBTagRuntimeError('Limit must be a number')]) }
            ]
        },
        {
            code: '{for;index;0;<;10;abc;{fail}}',
            expected: '`Increment must be a number`',
            errors: [
                { start: 0, end: 29, error: new AggregateBBTagError([new BBTagRuntimeError('Increment must be a number')]) }
            ]
        },
        {
            code: '{for;index;abc;def;ghi;jkl;{fail}}',
            expected: '`Initial must be a number, Invalid operator, Limit must be a number, Increment must be a number`',
            errors: [
                {
                    start: 0, end: 34, error: new AggregateBBTagError([
                        new BBTagRuntimeError('Initial must be a number'),
                        new InvalidOperatorError('def'),
                        new BBTagRuntimeError('Limit must be a number'),
                        new BBTagRuntimeError('Increment must be a number')
                    ])
                }
            ]
        },
        // TODO: Move this test once limits are reintroduced
        // {
        //     code: '{for;index;0;<;10;{get;index},}',
        //     expected: '0,1,2,3,`Too many loops`',
        //     errors: [
        //         { start: 0, end: 31, error: new BBTagRuntimeError('Too many loops') }
        //     ],
        //     replacers: [replacers.getReplacer],
        //     setup(ctx) {
        //         ctx.options.tagName = 'testTag';
        //         ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, 'initial');
        //     },
        //     postSetup(bbctx, ctx) {
        //         let i = 0;
        //         ctx.limit.setup(m => m.check(bbctx, 'for:loops')).verifiable(5).thenCall(() => {
        //             if (i++ >= 4)
        //                 throw new BBTagRuntimeError('Too many loops');
        //             return undefined;
        //         });
        //     },
        //     async assert(bbctx, _, ctx) {
        //         assert.equal((await bbctx.variables.get('index')).value, 'initial');
        //         assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 'initial');
        //     }
        // },
        {
            code: '{for;index;0;<;10;{get;index}{if;{get;index};==;5;{return}},}',
            expected: '0,1,2,3,4,5',
            replacers: [replacers.getReplacer, replacers.ifReplacer, replacers.returnReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                setupIndexes(variables, 'index', [0, 1, 2, 3, 4, 5], 2);
            }
        }
    ]
});

function setupIndexes(variables: Mock<VariableStore>, varName: string, values: Array<JToken | undefined>, getPerLoop = 1): void {
    setupVariables(variables, varName);
    for (const value of new Set(values))
        variables.setup(m => m.set(varName, value)).mustHappen(values.filter(x => x === value).length);
    variables.setup(m => m.get(varName)).mustHappen(values.length * (getPerLoop + 1));
    variables.setup((m, $) => m.rollback($.looksLike([varName]))).returns().mustHappen(1);
}

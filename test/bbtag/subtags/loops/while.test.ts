import assert from 'node:assert/strict';

import { BBTagRuntimeError, BBTagRuntimeState } from '@blargbot/bbtag';
import { DecrementSubtag, GetSubtag, IfSubtag, IncrementSubtag, OperatorSubtag, ReturnSubtag, SetSubtag, WhileSubtag } from '@blargbot/bbtag/subtags';
import { TagVariableType } from '@blargbot/domain';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new WhileSubtag(),
    argCountBounds: { min: { count: 2, noEval: [0, 1] }, max: { count: 4, noEval: [0, 1, 2, 3] } },
    names: ['while'],
    cases: [
        {
            code: '{while;{<;{get;index};10};{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            subtags: [new GetSubtag(), new IncrementSubtag(), new OperatorSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(10).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 10);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 10);
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            subtags: [new GetSubtag(), new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(10).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 10);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 10);
            }
        },
        {
            code: '{while;<;{get;index};10;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            subtags: [new GetSubtag(), new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(10).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 10);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 10);
            }
        },
        {
            code: '{while;{get;index};10;<;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            subtags: [new GetSubtag(), new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(10).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 10);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 10);
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index;2},}',
            expected: '2,4,6,8,10,',
            subtags: [new GetSubtag(), new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(5).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 10);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 10);
            }
        },
        {
            code: '{while;{get;index};>;0;{decrement;index},}',
            expected: '9,8,7,6,5,4,3,2,1,0,',
            subtags: [new GetSubtag(), new DecrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '10');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(10).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 0);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 0);
            }
        },
        {
            code: '{while;{get;index};<;513;{get;index},{set;index;{*;{get;index};2}}}',
            expected: '1,2,4,8,16,32,64,128,256,512,',
            subtags: [new GetSubtag(), new SetSubtag(), new OperatorSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '1');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(10).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, '1024');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), '1024');
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index},}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [new GetSubtag(), new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(5).invokesAsync(() => {
                    if (i++ >= 4)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 4);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 4);
            }
        },
        {
            code: '{while;abc;def;ghi;{increment;index},}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [new GetSubtag(), new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(5).invokesAsync(() => {
                    if (i++ >= 4)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 4);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 4);
            }
        },
        {
            code: '{while;true;{increment;index},}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [new GetSubtag(), new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(5).invokesAsync(() => {
                    if (i++ >= 4)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 4);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 4);
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index}{if;{get;index};==;6;{return}},}',
            expected: '1,2,3,4,5,6',
            subtags: [new GetSubtag(), new IfSubtag(), new ReturnSubtag(), new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'while:loops')).mustHappen(6).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 6);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 6);
                assert.equal(bbctx.state, BBTagRuntimeState.ABORT);
            }
        }
    ]
});

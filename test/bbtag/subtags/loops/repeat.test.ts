import assert from 'node:assert/strict';

import { BBTagRuntimeError, BBTagRuntimeState, NotANumberError } from '@blargbot/bbtag';
import { GetSubtag, IfSubtag, IncrementSubtag, RepeatSubtag, ReturnSubtag } from '@blargbot/bbtag/subtags';
import { TagVariableType } from '@blargbot/domain';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new RepeatSubtag(),
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    names: ['repeat', 'loop'],
    cases: [
        {
            code: '{repeat;abc;10}',
            expected: 'abcabcabcabcabcabcabcabcabcabc',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).mustHappen(10).resolves(undefined);
            }
        },
        {
            code: '{repeat;{increment;index},;8}',
            expected: '1,2,3,4,5,6,7,8,',
            subtags: [new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).mustHappen(8).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 8);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 8);
            }
        },
        {
            code: '{repeat;{fail};abc}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{repeat;{fail};-1}',
            expected: '`Can\'t be negative`',
            errors: [
                { error: new BBTagRuntimeError('Can\'t be negative') }
            ]
        },
        {
            code: '{repeat;{increment;index}{if;{get;index};==;6;{return}},;10}',
            expected: '1,2,3,4,5,6',
            subtags: [new GetSubtag(), new IfSubtag(), new ReturnSubtag(), new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).mustHappen(6).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 6);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 6);
                assert.equal(bbctx.state, BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{repeat;{increment;index},;10}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [new IncrementSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).mustHappen(5).invokesAsync(() => {
                    if (i++ >= 4)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('index')).value, 4);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 4);
            }
        }
    ]
});

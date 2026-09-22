import assert from 'node:assert/strict';

import { BBTagRuntimeError, BBTagRuntimeState, GetSubtag, IfSubtag, IncrementSubtag, NotANumberError, RepeatSubtag, ReturnSubtag } from '@blargbot/bbtag-engine';
import { TagVariableType } from '@blargbot/domain';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.repeatReplacer,
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    cases: [
        {
            code: '{repeat;abc;10}',
            expected: 'abcabcabcabcabcabcabcabcabcabc',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(10).thenResolve(undefined);
            }
        },
        {
            code: '{repeat;{increment;index},;8}',
            expected: '1,2,3,4,5,6,7,8,',
            subtags: [replacers.incrementReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(8).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.variables.get('index')).value, 8);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 8);
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
            subtags: [replacers.getReplacer, replacers.ifReplacer, replacers.returnReplacer, replacers.incrementReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(6).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.variables.get('index')).value, 6);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 6);
                assert.equal(bbctx.data.state, BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{repeat;{increment;index},;10}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [replacers.incrementReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(5).thenCall(() => {
                    if (i++ >= 4)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.variables.get('index')).value, 4);
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }), 4);
            }
        }
    ]
});

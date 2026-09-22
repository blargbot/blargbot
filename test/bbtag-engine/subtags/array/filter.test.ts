import assert from 'node:assert/strict';

import { BBTagRuntimeError, BBTagRuntimeState, CommentSubtag, FilterSubtag, GetSubtag, IfSubtag, LengthSubtag, OperatorSubtag, ReturnSubtag } from '@blargbot/bbtag-engine';
import { TagVariableType } from '@blargbot/domain';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.filterReplacer,
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    cases: [
        {
            code: '{filter;a;b;c{fail}}',
            expected: '[]'
        },
        {
            code: '{filter;a;arr1;{==;{length;{get;a}};4}}',
            expected: '["this","arr1"]',
            subtags: [replacers.getReplacer, replacers.operatorReplacer, replacers.lengthReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).verifiable(3).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
            }
        },
        {
            code: '{filter;a;{get;arr1};{==;{length;{get;a}};4}}',
            expected: '["this","arr1"]',
            subtags: [replacers.getReplacer, replacers.operatorReplacer, replacers.lengthReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).verifiable(3).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
            }
        },
        {
            code: '{filter;a;var1;{contains;aieou;{get;a}}}',
            expected: '["i","i","a"]',
            subtags: [replacers.getReplacer, replacers.operatorReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).verifiable(12).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
            }
        },
        {
            code: '{filter;a;var1;{//;aaaaaa}    {contains;aieou;{get;a}}}',
            expected: '["i","i","a"]',
            subtags: [replacers.getReplacer, replacers.operatorReplacer, replacers.commentReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).verifiable(12).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
            }
        },
        {
            code: '{filter;a;var1;{contains;aieou;{get;a}}      {//;aaaaaa}}',
            expected: '["i","i","a"]',
            subtags: [replacers.getReplacer, replacers.operatorReplacer, replacers.commentReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).verifiable(12).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
            }
        },
        {
            code: '{filter;a;var1;true{if;{get;a};==;s;{return}}}',
            expected: '["t","h","i","s"]',
            subtags: [replacers.getReplacer, replacers.ifReplacer, replacers.returnReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).verifiable(4).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
                assert.equal(bbctx.data.state, BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{filter;a;{get;arr1};true}',
            expected: '["this","`Too many loops`"]',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [replacers.getReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).verifiable(2).thenCall(() => {
                    if (i++ >= 1)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
            }
        }
    ]
});

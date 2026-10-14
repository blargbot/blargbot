import assert from 'node:assert/strict';

import { BBTagRuntimeError, BBTagRuntimeState } from '@blargbot/bbtag';
import { ForEachSubtag, GetSubtag, IfSubtag, ReturnSubtag } from '@blargbot/bbtag/subtags';
import { TagVariableType } from '@blargbot/domain';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ForEachSubtag(),
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    names: ['forEach'],
    cases: [
        {
            code: '{foreach;a;b;c{fail}}',
            expected: ''
        },
        {
            code: '{foreach;a;arr1;<{get;a}>}',
            expected: '<this><is><arr1>',
            subtags: [new GetSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'foreach:loops')).mustHappen(3).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
            }
        },
        {
            code: '{foreach;a;{get;arr1};<{get;a}>}',
            expected: '<this><is><arr1>',
            subtags: [new GetSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'foreach:loops')).mustHappen(3).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
            }
        },
        {
            code: '{foreach;a;var1;<{get;a}>}',
            expected: '<t><h><i><s>< ><i><s>< ><v><a><r><1>',
            subtags: [new GetSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'foreach:loops')).mustHappen(12).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
            }
        },
        {
            code: '{foreach;a;var1;<{get;a}>{if;{get;a};==;s;{return}}}',
            expected: '<t><h><i><s>',
            subtags: [new GetSubtag(), new IfSubtag(), new ReturnSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'foreach:loops')).mustHappen(4).resolves(undefined);
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
                assert.equal(bbctx.state, BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{foreach;a;{get;arr1};<{get;a}>}',
            expected: '<this>`Too many loops`',
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [new GetSubtag()],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, 'foreach:loops')).mustHappen(2).invokesAsync(() => {
                    if (i++ >= 1)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                assert.equal((await bbctx.root.variables.get('a')).value, 'initial');
                assert.equal(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }), 'initial');
            }
        }
    ]
});

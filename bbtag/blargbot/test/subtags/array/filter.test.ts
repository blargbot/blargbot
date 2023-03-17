import { BBTagRuntimeError, BBTagRuntimeState, TagVariableType } from '@bbtag/blargbot';
import { CommentSubtag, FilterSubtag, GetSubtag, IfSubtag, LengthSubtag, OperatorSubtag, ReturnSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: FilterSubtag,
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    cases: [
        {
            code: '{filter;a;b;c{fail}}',
            expected: '[]'
        },
        {
            code: '{filter;a;arr1;{==;{length;{get;a}};4}}',
            expected: '["this","arr1"]',
            subtags: [GetSubtag, OperatorSubtag, LengthSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'filter:loops')).verifiable(3).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('a')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' })).to.equal('initial');
            }
        },
        {
            code: '{filter;a;{get;arr1};{==;{length;{get;a}};4}}',
            expected: '["this","arr1"]',
            subtags: [GetSubtag, OperatorSubtag, LengthSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'filter:loops')).verifiable(3).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('a')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' })).to.equal('initial');
            }
        },
        {
            code: '{filter;a;var1;{contains;aieou;{get;a}}}',
            expected: '["i","i","a"]',
            subtags: [GetSubtag, OperatorSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'filter:loops')).verifiable(12).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('a')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' })).to.equal('initial');
            }
        },
        {
            code: '{filter;a;var1;{//;aaaaaa}    {contains;aieou;{get;a}}}',
            expected: '["i","i","a"]',
            subtags: [GetSubtag, OperatorSubtag, CommentSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'filter:loops')).verifiable(12).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('a')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' })).to.equal('initial');
            }
        },
        {
            code: '{filter;a;var1;{contains;aieou;{get;a}}      {//;aaaaaa}}',
            expected: '["i","i","a"]',
            subtags: [GetSubtag, OperatorSubtag, CommentSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'filter:loops')).verifiable(12).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('a')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' })).to.equal('initial');
            }
        },
        {
            code: '{filter;a;var1;true{if;{get;a};==;s;{return}}}',
            expected: '["t","h","i","s"]',
            subtags: [GetSubtag, IfSubtag, ReturnSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'filter:loops')).verifiable(4).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('a')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' })).to.equal('initial');
                chai.expect(bbctx.runtime.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{filter;a;{get;arr1};true}',
            expected: '["this","`Too many loops`"]',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [GetSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx.runtime, 'filter:loops')).verifiable(2).thenCall(() => {
                    if (i++ >= 1)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('a')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'a' })).to.equal('initial');
            }
        }
    ]
});

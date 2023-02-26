import { AggregateBBTagError, BBTagRuntimeError, BBTagRuntimeState, InvalidOperatorError, NotANumberError, Subtag, TagVariableType } from '@bbtag/blargbot';
import { ForSubtag, GetSubtag, IfSubtag, OperatorSubtag, ReturnSubtag, SetSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ForSubtag),
    argCountBounds: { min: { count: 5, noEval: [4] }, max: { count: 6, noEval: [5] } },
    cases: [
        {
            code: '{for;index;0;<;10;{get;index},}',
            expected: '0,1,2,3,4,5,6,7,8,9,',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'for:loops')).verifiable(10).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.variables.get('index')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' })).to.equal('initial');
            }
        },
        {
            code: '{for;index;0;<;10;2;{get;index},}',
            expected: '0,2,4,6,8,',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'for:loops')).verifiable(5).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.variables.get('index')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' })).to.equal('initial');
            }
        },
        {
            code: '{for;index;10;>;0;-1;{get;index},}',
            expected: '10,9,8,7,6,5,4,3,2,1,',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'for:loops')).verifiable(10).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.variables.get('index')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' })).to.equal('initial');
            }
        },
        {
            code: '{for;index;1;<;513;0;{get;index},{set;index;{*;{get;index};2}}}',
            expected: '1,2,4,8,16,32,64,128,256,512,',
            subtags: [Subtag.getDescriptor(GetSubtag), Subtag.getDescriptor(SetSubtag), Subtag.getDescriptor(OperatorSubtag)],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'for:loops')).verifiable(10).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.variables.get('index')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' })).to.equal('initial');
            }
        },
        {
            code: '{for;index;1;<;10;{set;index;abc}xyz}',
            expected: 'xyz`Not a number`',
            errors: [
                { start: 0, end: 37, error: new NotANumberError('abc') }
            ],
            subtags: [Subtag.getDescriptor(SetSubtag)],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'for:loops')).verifiable(1).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.variables.get('index')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' })).to.equal('initial');
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
        {
            code: '{for;index;0;<;10;{get;index},}',
            expected: '0,1,2,3,`Too many loops`',
            errors: [
                { start: 0, end: 31, error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, 'for:loops')).verifiable(5).thenCall(() => {
                    if (i++ >= 4)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.variables.get('index')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' })).to.equal('initial');
            }
        },
        {
            code: '{for;index;0;<;10;{get;index}{if;{get;index};==;5;{return}},}',
            expected: '0,1,2,3,4,5',
            subtags: [Subtag.getDescriptor(GetSubtag), Subtag.getDescriptor(IfSubtag), Subtag.getDescriptor(ReturnSubtag)],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, 'initial');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'for:loops')).verifiable(6).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.variables.get('index')).value).to.equal('initial');
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' })).to.equal('initial');
                chai.expect(bbctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        }
    ]
});

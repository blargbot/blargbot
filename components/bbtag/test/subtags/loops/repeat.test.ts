import { BBTagRuntimeError, BBTagRuntimeState, NotANumberError, Subtag } from '@bbtag/blargbot';
import { GetSubtag, IfSubtag, IncrementSubtag, RepeatSubtag, ReturnSubtag } from '@bbtag/blargbot/subtags';
import { TagVariableType } from '@blargbot/domain/models/index.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RepeatSubtag),
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
            subtags: [Subtag.getDescriptor(IncrementSubtag)],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(8).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.variables.get('index')).value).to.equal(8);
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' })).to.equal(8);
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
            subtags: [Subtag.getDescriptor(GetSubtag), Subtag.getDescriptor(IfSubtag), Subtag.getDescriptor(ReturnSubtag), Subtag.getDescriptor(IncrementSubtag)],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(6).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.variables.get('index')).value).to.equal(6);
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' })).to.equal(6);
                chai.expect(bbctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{repeat;{increment;index},;10}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [Subtag.getDescriptor(IncrementSubtag)],
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
                chai.expect((await bbctx.variables.get('index')).value).to.equal(4);
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'index' })).to.equal(4);
            }
        }
    ]
});

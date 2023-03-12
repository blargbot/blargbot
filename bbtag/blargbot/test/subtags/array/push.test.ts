import { NotAnArrayError, Subtag, TagVariableType } from '@bbtag/blargbot';
import { GetSubtag, PushSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(PushSubtag),
    argCountBounds: { min: 2, max: Infinity },
    cases: [
        {
            code: '{push;abc;def}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 14, error: new NotAnArrayError('abc') }
            ]
        },
        {
            code: '{push;var1;def}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 15, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
            }
        },
        {
            code: '{push;[1,2,3];def}',
            expected: '[1,2,3,"def"]'
        },
        {
            code: '{push;{get;arr1};def}',
            expected: '',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is', 'arr1', 'def']);
            }
        },
        {
            code: '{push;arr1;def}',
            expected: '',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is', 'arr1', 'def']);
            }
        },
        {
            code: '{push;!arr1;def}',
            expected: '',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.dependencies.variables.setup(m => m.set(argument.isDeepEqual([{ name: 'arr1', value: ['this', 'is', 'arr1', 'def'], scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' } }]))).thenResolve(undefined);
            },
            async assert(bbctx) {
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is', 'arr1', 'def']);
            }
        },
        {
            code: '{push;[];def;ghi;123}',
            expected: '["def","ghi","123"]'
        }
    ]
});

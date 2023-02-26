import { NotAnArrayError, Subtag, TagVariableType } from '@bbtag/blargbot';
import { GetSubtag, PopSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(PopSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{pop;abc}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 9, error: new NotAnArrayError('abc') }
            ]
        },
        {
            code: '{pop;var1}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 10, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
            }
        },
        {
            code: '{pop;[1,2,3]}',
            expected: '3'
        },
        {
            code: '{pop;{get;arr1}}',
            expected: 'arr1',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is']);
            }
        },
        {
            code: '{pop;arr1}',
            expected: 'arr1',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is']);
            }
        },
        {
            code: '{pop;!arr1}',
            expected: 'arr1',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariablesTable.setup(m => m.set(argument.isDeepEqual([{ name: 'arr1', value: ['this', 'is'], scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' } }]))).thenResolve(undefined);
            },
            async assert(bbctx) {
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is']);
            }
        },
        {
            code: '{pop;[]}',
            expected: ''
        }
    ]
});

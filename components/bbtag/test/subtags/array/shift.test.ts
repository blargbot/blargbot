import { Subtag } from '@blargbot/bbtag';
import { NotAnArrayError } from '@blargbot/bbtag/errors/index.js';
import { ShiftSubtag } from '@blargbot/bbtag/subtags/array/shift.js';
import { GetSubtag } from '@blargbot/bbtag/subtags/bot/get.js';
import { TagVariableType } from '@blargbot/domain/models/index.js';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ShiftSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{shift;abc}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 11, error: new NotAnArrayError('abc') }
            ]
        },
        {
            code: '{shift;var1}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 12, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
            }
        },
        {
            code: '{shift;[1,2,3]}',
            expected: '1'
        },
        {
            code: '{shift;{get;arr1}}',
            expected: 'this',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['is', 'arr1']);
            }
        },
        {
            code: '{shift;arr1}',
            expected: 'this',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['is', 'arr1']);
            }
        },
        {
            code: '{shift;!arr1}',
            expected: 'this',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ arr1: ['is', 'arr1'] }), argument.isDeepEqual({ type: TagVariableType.LOCAL_TAG, name: 'testTag' }))).thenResolve(undefined);
            },
            async assert(bbctx) {
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['is', 'arr1']);
            }
        },
        {
            code: '{shift;[]}',
            expected: ''
        }
    ]
});

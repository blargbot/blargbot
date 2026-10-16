import assert from 'node:assert/strict';

import { NotAnArrayError } from '@blargbot/bbtag';
import { GetSubtag, ShiftSubtag } from '@blargbot/bbtag/subtags';
import { TagVariableType } from '@blargbot/domain';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ShiftSubtag(),
    argCountBounds: { min: 1, max: 1 },
    names: ['shift'],
    cases: [
        {
            code: '{shift;abc}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('abc') }
            ]
        },
        {
            code: '{shift;var1}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                ctx.input.tagName = 'testTag';
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
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), ['this', 'is', 'arr1']);
                assert.deepEqual((await bbctx.root.variables.get('arr1')).value, ['is', 'arr1']);
            }
        },
        {
            code: '{shift;arr1}',
            expected: 'this',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), ['this', 'is', 'arr1']);
                assert.deepEqual((await bbctx.root.variables.get('arr1')).value, ['is', 'arr1']);
            }
        },
        {
            code: '{shift;!arr1}',
            expected: 'this',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ arr1: ['is', 'arr1'] }), $({ type: TagVariableType.LOCAL_TAG, name: 'testTag' }))).resolves(undefined);
            },
            async assert(bbctx) {
                assert.deepEqual((await bbctx.root.variables.get('arr1')).value, ['is', 'arr1']);
            }
        },
        {
            code: '{shift;[]}',
            expected: ''
        }
    ]
});

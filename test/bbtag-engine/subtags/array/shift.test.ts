import assert from 'node:assert/strict';

import { GetSubtag, NotAnArrayError, ShiftSubtag } from '@blargbot/bbtag-engine';
import { TagVariableType } from '@blargbot/domain';
import { $ } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.shiftReplacer,
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
            subtags: [replacers.getReplacer],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), ['this', 'is', 'arr1']);
                assert.deepEqual((await bbctx.variables.get('arr1')).value, ['is', 'arr1']);
            }
        },
        {
            code: '{shift;arr1}',
            expected: 'this',
            subtags: [replacers.getReplacer],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), ['this', 'is', 'arr1']);
                assert.deepEqual((await bbctx.variables.get('arr1')).value, ['is', 'arr1']);
            }
        },
        {
            code: '{shift;!arr1}',
            expected: 'this',
            subtags: [replacers.getReplacer],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariablesTable.setup(m => m.upsert($.looksLike({ arr1: ['is', 'arr1'] }), $.looksLike({ type: TagVariableType.LOCAL_TAG, name: 'testTag' }))).thenResolve(undefined);
            },
            async assert(bbctx) {
                assert.deepEqual((await bbctx.variables.get('arr1')).value, ['is', 'arr1']);
            }
        },
        {
            code: '{shift;[]}',
            expected: ''
        }
    ]
});

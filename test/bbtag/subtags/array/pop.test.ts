import assert from 'node:assert/strict';

import { NotAnArrayError } from '@blargbot/bbtag';
import { GetSubtag, PopSubtag } from '@blargbot/bbtag/subtags';
import { TagVariableType } from '@blargbot/domain';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new PopSubtag(),
    argCountBounds: { min: 1, max: 1 },
    names: ['pop'],
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
                ctx.input.tagName = 'testTag';
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
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), ['this', 'is', 'arr1']);
                assert.deepEqual((await bbctx.root.variables.get('arr1')).value, ['this', 'is']);
            }
        },
        {
            code: '{pop;arr1}',
            expected: 'arr1',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), ['this', 'is', 'arr1']);
                assert.deepEqual((await bbctx.root.variables.get('arr1')).value, ['this', 'is']);
            }
        },
        {
            code: '{pop;!arr1}',
            expected: 'arr1',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.input.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ arr1: ['this', 'is'] }), $({ type: TagVariableType.LOCAL_TAG, name: 'testTag' }))).resolves(undefined);
            },
            async assert(bbctx) {
                assert.deepEqual((await bbctx.root.variables.get('arr1')).value, ['this', 'is']);
            }
        },
        {
            code: '{pop;[]}',
            expected: ''
        }
    ]
});

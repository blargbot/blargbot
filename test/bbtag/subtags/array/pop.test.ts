import { NotAnArrayError } from '@blargbot/bbtag/errors/index.js';
import { PopSubtag } from '@blargbot/bbtag/subtags/array/pop.js';
import { GetSubtag } from '@blargbot/bbtag/subtags/bot/get.js';
import { TagVariableType } from '@blargbot/domain/models/index.js';
import { argument } from '@blargbot/test-util/mock.js';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new PopSubtag(),
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
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is']);
            }
        },
        {
            code: '{pop;arr1}',
            expected: 'arr1',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is']);
            }
        },
        {
            code: '{pop;!arr1}',
            expected: 'arr1',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ arr1: ['this', 'is'] }), argument.isDeepEqual({ type: TagVariableType.LOCAL_TAG, name: 'testTag' }))).thenResolve(undefined);
            },
            async assert(bbctx) {
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is']);
            }
        },
        {
            code: '{pop;[]}',
            expected: ''
        }
    ]
});

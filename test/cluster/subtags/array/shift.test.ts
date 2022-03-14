import { NotAnArrayError } from '@cluster/bbtag/errors';
import { ShiftSubtag } from '@cluster/subtags/array/shift';
import { GetSubtag } from '@cluster/subtags/bot/get';
import { SubtagVariableType } from '@core/types';
import { expect } from 'chai';

import { argument } from '../../../mock';
import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ShiftSubtag(),
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
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.var1`] = 'this is var1';
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
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`] = ['this', 'is', 'arr1'];
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`]).to.deep.equal(['this', 'is', 'arr1']);
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['is', 'arr1']);
            }
        },
        {
            code: '{shift;arr1}',
            expected: 'this',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`] = ['this', 'is', 'arr1'];
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`]).to.deep.equal(['this', 'is', 'arr1']);
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['is', 'arr1']);
            }
        },
        {
            code: '{shift;!arr1}',
            expected: 'this',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`] = ['this', 'is', 'arr1'];
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ arr1: ['is', 'arr1'] }), SubtagVariableType.LOCAL, 'testTag')).thenResolve(undefined);
            },
            async assert(bbctx) {
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['is', 'arr1']);
            }
        },
        {
            code: '{shift;[]}',
            expected: ''
        }
    ]
});

import { NotAnArrayError } from '@cluster/bbtag/errors';
import { SliceSubtag } from '@cluster/subtags/array/slice';
import { SubtagVariableType } from '@core/types';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SliceSubtag(),
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{slice;abc;0}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 13, error: new NotAnArrayError('abc') }
            ]
        },
        {
            code: '{slice;[1,2,3,4];0}',
            expected: '[1,2,3,4]'
        },
        {
            code: '{slice;[1,2,3,4];2;-1}',
            expected: '[3]'
        },
        {
            code: '{slice;[1,2,3,4];1}',
            expected: '[2,3,4]'
        },
        {
            code: '{slice;[1,2,3,4];1;3}',
            expected: '[2,3]'
        },
        {
            code: '{slice;arr1;1}',
            expected: '[2,3,4]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`] = [1, 2, 3, 4];
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`]).to.deep.equal([1, 2, 3, 4]);
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal([1, 2, 3, 4]);
            }
        },
        {
            code: '{slice;arr1;1;3}',
            expected: '[2,3]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`] = [1, 2, 3, 4];
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`]).to.deep.equal([1, 2, 3, 4]);
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal([1, 2, 3, 4]);
            }
        }
    ]
});

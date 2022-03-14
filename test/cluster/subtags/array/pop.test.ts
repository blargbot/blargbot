import { NotAnArrayError } from '@blargbot/cluster/bbtag/errors';
import { PopSubtag } from '@blargbot/cluster/subtags/array/pop';
import { GetSubtag } from '@blargbot/cluster/subtags/bot/get';
import { SubtagVariableType } from '@blargbot/core/types';
import { expect } from 'chai';

import { argument } from '../../../mock';
import { runSubtagTests } from '../SubtagTestSuite';

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
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.var1`] = 'this is var1';
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
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`] = ['this', 'is', 'arr1'];
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`]).to.deep.equal(['this', 'is', 'arr1']);
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
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`] = ['this', 'is', 'arr1'];
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`]).to.deep.equal(['this', 'is', 'arr1']);
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
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`] = ['this', 'is', 'arr1'];
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ arr1: ['this', 'is'] }), SubtagVariableType.LOCAL, 'testTag')).thenResolve(undefined);
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

import { NotAnArrayError } from '@blargbot/bbtag/errors';
import { PushSubtag } from '@blargbot/bbtag/subtags/array/push';
import { GetSubtag } from '@blargbot/bbtag/subtags/bot/get';
import { TagVariableType } from '@blargbot/domain/models';
import { argument } from '@blargbot/test-util/mock';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new PushSubtag(),
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
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.var1`] = 'this is var1';
            }
        },
        {
            code: '{push;[1,2,3];def}',
            expected: '[1,2,3,"def"]'
        },
        {
            code: '{push;{get;arr1};def}',
            expected: '',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.arr1`] = ['this', 'is', 'arr1'];
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.arr1`]).to.deep.equal(['this', 'is', 'arr1']);
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is', 'arr1', 'def']);
            }
        },
        {
            code: '{push;arr1;def}',
            expected: '',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.arr1`] = ['this', 'is', 'arr1'];
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.arr1`]).to.deep.equal(['this', 'is', 'arr1']);
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is', 'arr1', 'def']);
            }
        },
        {
            code: '{push;!arr1;def}',
            expected: '',
            subtags: [new GetSubtag()],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.arr1`] = ['this', 'is', 'arr1'];
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ arr1: ['this', 'is', 'arr1', 'def'] }), argument.isDeepEqual({ type: TagVariableType.LOCAL, name: 'testTag' }))).thenResolve(undefined);
            },
            async assert(bbctx) {
                expect((await bbctx.variables.get('arr1')).value).to.deep.equal(['this', 'is', 'arr1', 'def']);
            }
        },
        {
            code: '{push;[];def;ghi;123}',
            expected: '["def","ghi","123"]'
        }
    ]
});

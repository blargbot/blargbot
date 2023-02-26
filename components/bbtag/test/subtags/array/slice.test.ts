import { NotAnArrayError, NotANumberError, Subtag, TagVariableType } from '@bbtag/blargbot';
import { SliceSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(SliceSubtag),
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
            code: '{slice;[1,2,3,4];abc;3}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 23, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{slice;[1,2,3,4];1;def}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 23, error: new NotANumberError('def') }
            ]
        },
        {
            code: '{slice;arr1;1}',
            expected: '[2,3,4]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4]);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal([1, 2, 3, 4]);
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal([1, 2, 3, 4]);
            }
        },
        {
            code: '{slice;arr1;1;3}',
            expected: '[2,3]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4]);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal([1, 2, 3, 4]);
                chai.expect((await bbctx.variables.get('arr1')).value).to.deep.equal([1, 2, 3, 4]);
            }
        }
    ]
});

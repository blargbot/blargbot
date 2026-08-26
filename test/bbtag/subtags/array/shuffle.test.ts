import { NotAnArrayError } from '@blargbot/bbtag/errors/index.js';
import { ShuffleSubtag } from '@blargbot/bbtag/subtags/array/shuffle.js';
import { GetSubtag } from '@blargbot/bbtag/subtags/bot/get.js';
import { TagVariableType } from '@blargbot/domain/models/index.js';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new ShuffleSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{shuffle}',
            expected: '',
            retries: 1,
            setup(ctx) {
                ctx.options.inputRaw = 'arg1 arg2 arg3 arg4';
            },
            assert(bbctx) {
                expect(bbctx.input).to.not.deep.equal(['arg1', 'arg2', 'arg3', 'arg4']);
                expect(bbctx.input).to.have.members(['arg1', 'arg2', 'arg3', 'arg4']);
            }
        },
        {
            code: '{shuffle;abc}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 13, error: new NotAnArrayError('abc') }
            ]
        },
        {
            code: '{shuffle;var1}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 14, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
            }
        },
        {
            code: '{shuffle;[1,2,3,4,5,6]}',
            retries: 1,
            assert(_, result) {
                expect(result).to.not.equal('[1,2,3,4,5,6]');
                const jResult = JSON.parse(result);
                expect(jResult).to.have.members([1, 2, 3, 4, 5, 6]);
            }
        },
        {
            code: '{shuffle;{get;arr1}}',
            expected: '',
            subtags: [new GetSubtag()],
            retries: 1,
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            async assert(bbctx, _, ctx) {
                expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal([1, 2, 3, 4, 5, 6]);
                const result = (await bbctx.variables.get('arr1')).value;
                expect(result).to.not.deep.equal([1, 2, 3, 4, 5, 6]);
                expect(result).to.have.members([1, 2, 3, 4, 5, 6]);
            }
        }
    ]
});

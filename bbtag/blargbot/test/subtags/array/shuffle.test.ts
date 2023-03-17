import { NotAnArrayError, TagVariableType } from '@bbtag/blargbot';
import { GetSubtag, ShuffleSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: ShuffleSubtag,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{shuffle}',
            expected: '',
            retries: 1,
            setup(ctx) {
                ctx.entrypoint.inputRaw = 'arg1 arg2 arg3 arg4';
            },
            assert(bbctx) {
                chai.expect(bbctx.input).to.not.deep.equal(['arg1', 'arg2', 'arg3', 'arg4']);
                chai.expect(bbctx.input).to.have.members(['arg1', 'arg2', 'arg3', 'arg4']);
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
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 'this is var1');
            }
        },
        {
            code: '{shuffle;[1,2,3,4,5,6]}',
            retries: 1,
            assert(_, result) {
                chai.expect(result).to.not.equal('[1,2,3,4,5,6]');
                const jResult = JSON.parse(result);
                chai.expect(jResult).to.have.members([1, 2, 3, 4, 5, 6]);
            }
        },
        {
            code: '{shuffle;{get;arr1}}',
            expected: '',
            subtags: [GetSubtag],
            retries: 1,
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal([1, 2, 3, 4, 5, 6]);
                const result = (await bbctx.runtime.variables.get('arr1')).value;
                chai.expect(result).to.not.deep.equal([1, 2, 3, 4, 5, 6]);
                chai.expect(result).to.have.members([1, 2, 3, 4, 5, 6]);
            }
        }
    ]
});

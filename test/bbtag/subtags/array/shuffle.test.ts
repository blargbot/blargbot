import assert from 'node:assert/strict';

import { NotAnArrayError } from '@blargbot/bbtag/errors/index.js';
import { ShuffleSubtag } from '@blargbot/bbtag/subtags/array/shuffle.js';
import { GetSubtag } from '@blargbot/bbtag/subtags/bot/get.js';
import { TagVariableType } from '@blargbot/domain/models/index.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
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
                assert.notDeepEqual(bbctx.input, ['arg1', 'arg2', 'arg3', 'arg4']);
                assert.equal(bbctx.input.length, 4);
                for (const value of ['arg1', 'arg2', 'arg3', 'arg4'])
                    assert(bbctx.input.includes(value), `[${bbctx.input.join(',')}] is missing ${value}`);
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
                assert.notEqual(result, '[1,2,3,4,5,6]');
                const jResult = JSON.parse(result);
                assert(Array.isArray(jResult), `${result} should have been an array.`);
                assert.equal(jResult.length, 6);
                for (const value of [1, 2, 3, 4, 5, 6])
                    assert(jResult.includes(value), `[${jResult.join(',')}] is missing ${value}`);
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
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 3, 4, 5, 6]);
                const result = (await bbctx.variables.get('arr1')).value;
                assert.notDeepEqual(result, [1, 2, 3, 4, 5, 6]);
                assert(Array.isArray(result), `${JSON.stringify(result)} should have been an array.`);
                assert.equal(result.length, 6);
                for (const value of [1, 2, 3, 4, 5, 6])
                    assert(result.includes(value), `[${result.join(',')}] is missing ${value}`);
            }
        }
    ]
});

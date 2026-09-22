import assert from 'node:assert/strict';

import { GetSubtag, NotAnArrayError, NotANumberError, SpliceSubtag } from '@blargbot/bbtag-engine';
import { TagVariableType } from '@blargbot/domain';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.spliceReplacer,
    argCountBounds: { min: 2, max: Infinity },
    cases: [
        {
            code: '{splice;arr1;0}',
            expected: '[]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 3, 4, 5, 6]);
            }
        },
        {
            code: '{splice;arr1;1}',
            expected: '[]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 3, 4, 5, 6]);
            }
        },
        {
            code: '{splice;arr1;2;1}',
            expected: '[3]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 4, 5, 6]);
            }
        },
        {
            code: '{splice;arr1;1;3}',
            expected: '[2,3,4]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 5, 6]);
            }
        },
        {
            code: '{splice;arr1;4;3}',
            expected: '[5,6]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 3, 4]);
            }
        },
        {
            code: '{splice;arr1;2;0;a}',
            expected: '[]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 'a', 3, 4, 5, 6]);
            }
        },
        {
            code: '{splice;arr1;2;1;a}',
            expected: '[3]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 'a', 4, 5, 6]);
            }
        },
        {
            code: '{splice;arr1;2;2;a;b;c;d;e;f}',
            expected: '[3,4]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 'a', 'b', 'c', 'd', 'e', 'f', 5, 6]);
            }
        },
        {
            code: '{splice;arr1;2;2;a;1;2;d;e;f}',
            expected: '[3,4]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 'a', '1', '2', 'd', 'e', 'f', 5, 6]);
            }
        },
        {
            code: '{splice;arr1;2;2;a;[1,2,"d"];e;f}',
            expected: '[3,4]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 'a', 1, 2, 'd', 'e', 'f', 5, 6]);
            }
        },
        {
            code: '{splice;arr1;2;2;a;[[1,2,"d"]];e;f}',
            expected: '[3,4]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 'a', [1, 2, 'd'], 'e', 'f', 5, 6]);
            }
        },
        {
            code: '{splice;{get;arr1};2;2;a;[[1,2,"d"]];e;f}',
            expected: '[3,4]',
            subtags: [replacers.getReplacer],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, [1, 2, 3, 4, 5, 6]);
            },
            assert(_, __, ctx) {
                assert.deepEqual(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }), [1, 2, 'a', [1, 2, 'd'], 'e', 'f', 5, 6]);
            }
        },
        {
            code: '{splice;[1,2,3,4,5,6];2;2;a;[[1,2,"d"]];e;f}',
            expected: '[3,4]'
        },
        {
            code: '{splice;var1;2;2;a;[[1,2,"d"]];e;f}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 35, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, 'abc');
            }
        },
        {
            code: '{splice;[1,2,3,4,5,6];abc;2;a;[[1,2,"d"]];e;f}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 46, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{splice;[1,2,3,4,5,6];2;def;a;[[1,2,"d"]];e;f}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 46, error: new NotANumberError('def') }
            ]
        }
    ]
});

import assert from 'node:assert/strict';

import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { NotAnArrayError } from '@blargbot/bbtag';
import { GetSubtag, ShuffleSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new ShuffleSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 0, max: 1 },
    names: ['shuffle'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{shuffle}',
            expected: '',
            retries: 1,
            setup(ctx) {
                ctx.input.array = ['arg1', 'arg2', 'arg3', 'arg4'];
            },
            assert(ctx) {
                assert.notDeepEqual(ctx.bbtag.local.input.array, ['arg1', 'arg2', 'arg3', 'arg4']);
                assert.equal(ctx.bbtag.local.input.array.length, 4);
                for (const value of ['arg1', 'arg2', 'arg3', 'arg4'])
                    assert(ctx.bbtag.local.input.array.includes(value), `[${ctx.bbtag.local.input.array.join(',')}] is missing ${value}`);
            }
        },
        {
            code: '{shuffle;abc}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('abc') }
            ]
        },
        {
            code: '{shuffle;var1}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('var1') }
            ]
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
                    assert(jResult.includes(value), `${result} is missing ${value}`);
            }
        },
        {
            code: '{shuffle;{get;arr1}}',
            expected: '',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('foo', $.setEqual([1, 2, 3, 4, 5, 6]))).resolves().mustHappen(1);
            }
        }
    ]
});

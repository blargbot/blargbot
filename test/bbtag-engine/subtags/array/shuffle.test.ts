import assert from 'node:assert';

import type { ArgsLocals, VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { NotAnArrayError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

function hasSameMembers(a: Iterable<unknown>, b: Iterable<unknown>): boolean {
    const arrA = [...a];
    const arrB = [...b];
    if (arrA.length !== arrB.length)
        return false;

    for (const item of arrA) {
        const index = arrB.indexOf(item);
        if (index === -1)
            return false;
        arrB.splice(index, 1);
    }
    return true;
}

await runSubtagTests<VariablesLocals & ArgsLocals>({
    replacer: replacers.shuffleReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{shuffle}',
            expected: '',
            retries: 1,
            setup(ctx) {
                ctx.locals.setup(m => m.args).returns(['arg1', 'arg2', 'arg3', 'arg4']);
            },
            assert(ctx) {
                assert(hasSameMembers(ctx.locals.args, ['arg1', 'arg2', 'arg3', 'arg4']));
            }
        },
        {
            code: '{shuffle;abc}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 13, error: new NotAnArrayError('abc') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('abc')).returns({ key: '$abc', value: undefined }).mustHappen();
            }
        },
        {
            code: '{shuffle;var1}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 14, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('var1')).returns({ key: '$var1', value: undefined }).mustHappen();
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
                    assert(jResult.includes(value), `${result} is missing ${value}`);
            }
        },
        {
            code: '{shuffle;{get;arr1}}',
            expected: '',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const items = [1, 2, 3, 4, 5, 6];
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$abc', value: [...items] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $.satisfies(v => Array.isArray(v) && hasSameMembers(v, items)))).returns().mustHappen();
            }
        }
    ]
});

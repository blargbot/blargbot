import assert from 'node:assert/strict';

import type { BBTagExpression } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.functionReplacer,
    names: ['function', 'func'],
    argCountBounds: { min: { count: 2, noEval: [1] }, max: { count: 2, noEval: [1] } },
    setup(ctx) {
        ctx.locals.setup(m => m.functions).returns({});
    },
    cases: [
        {
            code: '{function;test;{fail}}',
            expected: '',
            assert(ctx) {
                assertLooksLike(ctx.locals.functions['func.test'], {
                    values: [
                        {
                            name: {
                                values: ['fail'],
                                source: 'fail',
                                start: { column: 16, line: 0, index: 16 },
                                end: { column: 20, line: 0, index: 20 }
                            },
                            args: [],
                            source: '{fail}',
                            start: { column: 15, line: 0, index: 15 },
                            end: { column: 21, line: 0, index: 21 }
                        }
                    ],
                    source: '{fail}',
                    start: { column: 15, line: 0, index: 15 },
                    end: { column: 21, line: 0, index: 21 }
                } satisfies BBTagExpression);
            }
        },
        {
            code: '{function;func.test;{fail}}',
            expected: '',
            assert(ctx) {
                assertLooksLike(ctx.locals.functions['func.test'], {
                    values: [
                        {
                            name: {
                                values: ['fail'],
                                source: 'fail',
                                start: { column: 21, line: 0, index: 21 },
                                end: { column: 25, line: 0, index: 25 }
                            },
                            args: [],
                            source: '{fail}',
                            start: { column: 20, line: 0, index: 20 },
                            end: { column: 26, line: 0, index: 26 }
                        }
                    ],
                    source: '{fail}',
                    start: { column: 20, line: 0, index: 20 },
                    end: { column: 26, line: 0, index: 26 }
                } satisfies BBTagExpression);
            }
        },
        {
            code: '{function;func.;{fail}}',
            expected: '`Must provide a name`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Must provide a name') }
            ],
            assert(ctx) {
                assert.equal(ctx.locals.functions['func.'], undefined);
            }
        }
    ]
});

function assertLooksLike<T>(actual: T, expected: T): void {
    compare(actual, expected, 'actual');
    function compare(actual: unknown, expected: unknown, path: string): void {
        if (expected === null || typeof expected !== 'object') {
            assert.deepStrictEqual(actual, expected, `${path} differs`);
            return;
        }

        assert(actual !== null, `${path} is null`);
        assert(typeof actual === 'object', `${path} is not an object`);

        for (const key of Reflect.ownKeys(expected)) {
            assert(key in actual, `${path}.${String(key)} does not exist`);

            compare(
                (actual as Record<PropertyKey, unknown>)[key],
                (expected as Record<PropertyKey, unknown>)[key],
                `${path}.${String(key)}`
            );
        }
    }
}

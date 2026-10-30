import type { NumericOperator } from '@blargbot/bbtag-engine';
import { InvalidOperatorError, NotANumberError } from '@blargbot/bbtag-engine';
import { MathSubtag } from '@blargbot/bbtag-engine/subtags';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const exp = Math.pow;

await runSubtagTests({
    subtag: new MathSubtag(),
    argCountBounds: { min: 2, max: Infinity },
    names: ['math'],
    cases: [
        ...createTestCases([0], { '%': 0, '*': 0, '+': 0, '-': 0, '/': 0, '^': 0 }),
        ...createTestCases([1], { '%': 1, '*': 1, '+': 1, '-': 1, '/': 1, '^': 1 }),
        ...createTestCases([7, 13, 8], { '%': 7 % 13 % 8, '*': 7 * 13 * 8, '+': 7 + 13 + 8, '-': 7 - 13 - 8, '/': 7 / 13 / 8, '^': exp(exp(7, 13), 8) }),
        ...createTestCases([0, 0], { '%': NaN, '*': 0, '+': 0, '-': 0, '/': NaN, '^': 1 }),
        {
            code: '{math;abc;1;2;3}',
            expected: '`Invalid operator`',
            errors: [
                { error: new InvalidOperatorError('abc') }
            ]
        },
        {
            code: '{math;/;1;abc;3}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ]
        }
    ]
});

function createTestCases(args: number[], results: Record<NumericOperator, number>): SubtagTestCase[] {
    return Object.entries(results).flatMap(([op, expected]) => [
        { code: `{math;${op};${args.join(';')}}`, expected: expected.toString() },
        { code: `{math;${op};${JSON.stringify(args)}}`, expected: expected.toString() }
    ]);
}

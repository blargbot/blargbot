import type { NumericOperator } from '@blargbot/bbtag';
import { InvalidOperatorError, NotANumberError, Subtag  } from '@blargbot/bbtag';
import { MathSubtag } from '@blargbot/bbtag/subtags';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const exp = Math.pow;

runSubtagTests({
    subtag: Subtag.getDescriptor(MathSubtag),
    argCountBounds: { min: 2, max: Infinity },
    cases: [
        ...createTestCases([0], { '%': 0, '*': 0, '+': 0, '-': 0, '/': 0, '^': 0 }),
        ...createTestCases([1], { '%': 1, '*': 1, '+': 1, '-': 1, '/': 1, '^': 1 }),
        ...createTestCases([7, 13, 8], { '%': 7 % 13 % 8, '*': 7 * 13 * 8, '+': 7 + 13 + 8, '-': 7 - 13 - 8, '/': 7 / 13 / 8, '^': exp(exp(7, 13), 8) }),
        ...createTestCases([0, 0], { '%': NaN, '*': 0, '+': 0, '-': 0, '/': NaN, '^': 1 }),
        {
            code: '{math;abc;1;2;3}',
            expected: '`Invalid operator`',
            errors: [
                { start: 0, end: 16, error: new InvalidOperatorError('abc') }
            ]
        },
        {
            code: '{math;/;1;abc;3}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 16, error: new NotANumberError('abc') }
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

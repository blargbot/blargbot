import { NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { LogicSubtag } from '@cluster/subtags/misc/logic';
import { LogicOperator } from '@cluster/utils/bbtag/operators';

import { MarkerError, runSubtagTests, SubtagTestCase } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LogicSubtag(),
    cases: [
        {
            code: '{logic}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 7, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{logic;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 7, end: 13, error: new MarkerError(7) },
                { start: 0, end: 14, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        ...generateTestCases([true], { '!': false, '&&': true, '^': true, '||': true, xor: true }),
        ...generateTestCases([false], { '!': true, '&&': false, '^': false, '||': false, xor: false }),
        ...generateTestCases([true, true], { '!': false, '&&': true, '^': false, '||': true, xor: false }),
        ...generateTestCases([true, false], { '!': false, '&&': false, '^': true, '||': true, xor: true }),
        ...generateTestCases([false, true], { '!': true, '&&': false, '^': true, '||': true, xor: true }),
        ...generateTestCases([false, false], { '!': true, '&&': false, '^': false, '||': false, xor: false }),
        ...generateTestCases([true, true, true], { '!': false, '&&': true, '^': false, '||': true, xor: false }),
        ...generateTestCases([true, false, true], { '!': false, '&&': false, '^': false, '||': true, xor: false }),
        ...generateTestCases([false, true, false], { '!': true, '&&': false, '^': true, '||': true, xor: true })

    ]
});

function generateTestCases(args: boolean[], results: Record<LogicOperator, boolean>): SubtagTestCase[] {
    return Object.entries(results).flatMap(([operator, expected]) => [
        { code: `{logic;${operator};${args.join(';')}}`, expected: expected.toString() },
        { code: `{logic;${args.join(';')};${operator}}`, expected: expected.toString() },
        { code: `{logic;${args[0]};${[operator, ...args.slice(1)].join(';')}}`, expected: expected.toString() }
    ]);
}

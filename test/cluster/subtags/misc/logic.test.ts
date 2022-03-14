import { InvalidOperatorError, NotABooleanError } from '@blargbot/cluster/bbtag/errors';
import { LogicSubtag } from '@blargbot/cluster/subtags/misc/logic';
import { LogicOperator } from '@blargbot/cluster/utils/bbtag/operators';

import { MarkerError, runSubtagTests, SubtagTestCase } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LogicSubtag(),
    argCountBounds: { min: 2, max: Infinity },
    cases: [
        {
            code: '{logic;{eval}aaaa;{eval}}',
            expected: '`Invalid operator`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { start: 18, end: 24, error: new MarkerError('eval', 18) },
                { start: 0, end: 25, error: new InvalidOperatorError('aaaa') }
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
        ...generateTestCases([false, true, false], { '!': true, '&&': false, '^': true, '||': true, xor: true }),
        {
            code: '{logic;!;{eval}aaaa}',
            expected: '`Not a boolean`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 0, end: 20, error: new NotABooleanError('aaaa') }
            ]
        },
        {
            code: '{logic;!;true;{eval}aaaa}',
            expected: '`Not a boolean`',
            errors: [
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 0, end: 25, error: new NotABooleanError('aaaa') }
            ]
        },
        {
            code: '{logic;||;{eval}aaaa}',
            expected: '`Not a boolean`',
            errors: [
                { start: 10, end: 16, error: new MarkerError('eval', 10) },
                { start: 0, end: 21, error: new NotABooleanError('aaaa') }
            ]
        }
    ]
});

function generateTestCases(args: boolean[], results: Record<LogicOperator | '^', boolean>): SubtagTestCase[] {
    return Object.entries(results).flatMap(([operator, expected]) => [
        { code: `{logic;${operator};${args.join(';')}}`, expected: expected.toString() },
        { code: `{logic;${args.join(';')};${operator}}`, expected: expected.toString() },
        { code: `{logic;${args[0]};${[operator, ...args.slice(1)].join(';')}}`, expected: expected.toString() }
    ]);
}

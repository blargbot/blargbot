import type { LogicOperator, NumericOperator, OrdinalOperator, StringOperator } from '@bbtag/blargbot';
import { InvalidOperatorError, ordinalOperators, stringOperators, Subtag } from '@bbtag/blargbot';
import { OperatorSubtag } from '@bbtag/blargbot/subtags';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const exp = Math.pow;
const isEqualTo = { '!=': false, '<': false, '<=': true, '==': true, '>': false, '>=': true, 'startswith': true, 'endswith': true, 'includes': true, 'contains': true } as const;
const isGreaterThan = { '!=': true, '<': false, '<=': false, '==': false, '>': true, '>=': true } as const;
const isLessThan = { '!=': true, '<': true, '<=': true, '==': false, '>': false, '>=': false } as const;
const contains = { 'startswith': false, 'endswith': false, 'includes': true, 'contains': true } as const;
const startsWith = { 'startswith': true, 'endswith': false, 'includes': true, 'contains': true } as const;
const endsWith = { 'startswith': false, 'endswith': true, 'includes': true, 'contains': true } as const;
const doesntContain = { 'startswith': false, 'endswith': false, 'includes': false, 'contains': false } as const;
const isFalse = { '!=': false, '<': false, '<=': false, '==': false, '>': false, '>=': false } as const;

runSubtagTests({
    subtag: Subtag.getDescriptor(OperatorSubtag),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{operator;{eval}}',
            expected: '`Invalid operator`',
            errors: [
                { start: 10, end: 16, error: new MarkerError('eval', 10) },
                { start: 0, end: 17, error: new InvalidOperatorError('operator') }
            ]
        },
        ...createNumericTestCases([0], { '%': 0, '*': 0, '+': 0, '-': 0, '/': 0, '^': 0 }),
        ...createNumericTestCases([1], { '%': 1, '*': 1, '+': 1, '-': 1, '/': 1, '^': 1 }),
        ...createNumericTestCases([7, 13, 8], { '%': 7 % 13 % 8, '*': 7 * 13 * 8, '+': 7 + 13 + 8, '-': 7 - 13 - 8, '/': 7 / 13 / 8, '^': exp(exp(7, 13), 8) }),
        ...createNumericTestCases([0, 0], { '%': NaN, '*': 0, '+': 0, '-': 0, '/': NaN, '^': 1 }),
        ...createLogicTestCases([false], { '!': true, '&&': false, '||': false, xor: false }),
        ...createLogicTestCases([true], { '!': false, '&&': true, '||': true, xor: true }),
        ...createLogicTestCases([true, true], { '!': false, '&&': true, '||': true, xor: false }),
        ...createLogicTestCases([true, false], { '!': false, '&&': false, '||': true, xor: true }),
        ...createLogicTestCases([false, true], { '!': true, '&&': false, '||': true, xor: true }),
        ...createLogicTestCases([false, false], { '!': true, '&&': false, '||': false, xor: false }),
        ...createLogicTestCases([true, false, true], { '!': false, '&&': false, '||': true, xor: false }),
        ...createLogicTestCases([false, true, false], { '!': true, '&&': false, '||': true, xor: true }),
        ...createOrdinalTestCases(['123'], isFalse),
        ...createOrdinalTestCases(['true'], isFalse),
        ...createOrdinalTestCases(['t'], isFalse),
        ...createOrdinalTestCases(['yes'], isFalse),
        ...createOrdinalTestCases(['y'], isFalse),
        ...createOrdinalTestCases(['false'], isFalse),
        ...createOrdinalTestCases(['f'], isFalse),
        ...createOrdinalTestCases(['no'], isFalse),
        ...createOrdinalTestCases(['n'], isFalse),
        ...createOrdinalTestCases(['123', '123'], isEqualTo),
        ...createOrdinalTestCases(['123', '122'], isGreaterThan),
        ...createOrdinalTestCases(['123', '124'], isLessThan),
        ...createOrdinalTestCases(['abc', '123'], isGreaterThan),
        ...createOrdinalTestCases(['test22abc', 'test100abc'], isLessThan),
        ...createOrdinalTestCases(['test100abc', 'test90abc'], isGreaterThan),
        ...createOrdinalTestCases(['test100abc', 'test0100abc'], isEqualTo),
        ...createOrdinalTestCases(['true', 'true'], isEqualTo),
        ...createOrdinalTestCases(['true', 't'], isGreaterThan),
        ...createOrdinalTestCases(['true', 'yes'], isLessThan),
        ...createOrdinalTestCases(['true', 'y'], isLessThan),
        ...createOrdinalTestCases(['true', 'false'], isGreaterThan),
        ...createOrdinalTestCases(['true', 'f'], isGreaterThan),
        ...createOrdinalTestCases(['true', 'no'], isGreaterThan),
        ...createOrdinalTestCases(['true', 'n'], isGreaterThan),
        ...createOrdinalTestCases(['false', 'true'], isLessThan),
        ...createOrdinalTestCases(['false', 't'], isLessThan),
        ...createOrdinalTestCases(['false', 'yes'], isLessThan),
        ...createOrdinalTestCases(['false', 'y'], isLessThan),
        ...createOrdinalTestCases(['false', 'false'], isEqualTo),
        ...createOrdinalTestCases(['false', 'f'], isGreaterThan),
        ...createOrdinalTestCases(['false', 'no'], isLessThan),
        ...createOrdinalTestCases(['false', 'n'], isLessThan),
        ...createStringTestCases(['123', '123'], isEqualTo),
        ...createStringTestCases(['123', '124'], doesntContain),
        ...createStringTestCases(['123', '12'], startsWith),
        ...createStringTestCases(['123', '23'], endsWith),
        ...createStringTestCases(['123', '2'], contains),
        ...createStringTestCases(['true', 'true'], isEqualTo),
        ...createStringTestCases(['true', 't'], startsWith),
        ...createStringTestCases(['true', 'yes'], doesntContain),
        ...createStringTestCases(['true', 'y'], doesntContain),
        ...createStringTestCases(['true', 'false'], doesntContain),
        ...createStringTestCases(['true', 'f'], doesntContain),
        ...createStringTestCases(['true', 'no'], doesntContain),
        ...createStringTestCases(['true', 'n'], doesntContain),
        ...createStringTestCases(['false', 'true'], doesntContain),
        ...createStringTestCases(['false', 't'], doesntContain),
        ...createStringTestCases(['false', 'yes'], doesntContain),
        ...createStringTestCases(['false', 'y'], doesntContain),
        ...createStringTestCases(['false', 'false'], isEqualTo),
        ...createStringTestCases(['false', 'f'], startsWith),
        ...createStringTestCases(['false', 'no'], doesntContain),
        ...createStringTestCases(['false', 'n'], doesntContain),
        ...createStringTestCases(['[1,2,3]', '2'], contains),
        ...createStringTestCases(['[1,2,3]', ','], doesntContain),
        ...createStringTestCases(['How are you', 'y'], contains),
        { code: '{??;}', expected: '' },
        { code: '{??;;;;}', expected: '' },
        { code: '{??;abc}', expected: 'abc' },
        { code: '{??;;abc;def}', expected: 'abc' },
        { code: '{??;;;abc;def}', expected: 'abc' }
    ]
});

function createNumericTestCases(args: number[], results: Record<NumericOperator, number>): SubtagTestCase[] {
    return Object.entries(results).flatMap(([op, expected]) => [
        { code: `{${op};${args.join(';')}}`, expected: expected.toString() }
    ]);
}

function createLogicTestCases(args: boolean[], results: Record<Exclude<LogicOperator, '^'>, boolean>): SubtagTestCase[] {
    return Object.entries(results).flatMap(([op, expected]) => [
        { code: `{${op};${args.join(';')}}`, expected: expected.toString() }
    ]);
}

function createOrdinalTestCases(args: string[], results: Record<OrdinalOperator, boolean>): SubtagTestCase[] {
    return Object.entries(results).filter(x => ordinalOperators.test(x[0])).flatMap(([op, expected]) => [
        { code: `{${op};${args.join(';')}}`, expected: expected.toString() }
    ]);
}

function createStringTestCases(args: string[], results: Record<StringOperator, boolean>): SubtagTestCase[] {
    return Object.entries(results).filter(x => stringOperators.test(x[0])).flatMap(([op, expected]) => [
        { code: `{${op};${args.join(';')}}`, expected: expected.toString() }
    ]);
}

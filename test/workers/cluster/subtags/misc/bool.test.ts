import { InvalidOperatorError } from '@cluster/bbtag/errors';
import { BoolSubtag } from '@cluster/subtags/misc/bool';
import { bbtagUtil } from '@cluster/utils';

import { MarkerError, runSubtagTests, SubtagTestCase } from '../SubtagTestSuite';

const isEqualTo = { '!=': false, '<': false, '<=': true, '==': true, '>': false, '>=': true, 'startswith': true, 'endswith': true, 'includes': true, 'contains': true } as const;
const isGreaterThan = { '!=': true, '<': false, '<=': false, '==': false, '>': true, '>=': true } as const;
const isLessThan = { '!=': true, '<': true, '<=': true, '==': false, '>': false, '>=': false } as const;
const contains = { 'startswith': false, 'endswith': false, 'includes': true, 'contains': true } as const;
const startsWith = { 'startswith': true, 'endswith': false, 'includes': true, 'contains': true } as const;
const endsWith = { 'startswith': false, 'endswith': true, 'includes': true, 'contains': true } as const;
const doesntContain = { 'startswith': false, 'endswith': false, 'includes': false, 'contains': false } as const;

runSubtagTests({
    subtag: new BoolSubtag(),
    argCountBounds: { min: 3, max: 3 },
    cases: [
        ...generateOrdinalTestCases('123', isEqualTo, '123'),
        ...generateOrdinalTestCases('123', isGreaterThan, '122'),
        ...generateOrdinalTestCases('123', isLessThan, '124'),
        ...generateOrdinalTestCases('abc', isGreaterThan, '123'),
        ...generateOrdinalTestCases('test22abc', isLessThan, 'test100abc'),
        ...generateOrdinalTestCases('test100abc', isGreaterThan, 'test90abc'),
        ...generateOrdinalTestCases('test100abc', isEqualTo, 'test0100abc'),
        ...generateOrdinalTestCases(true, isEqualTo, true),
        ...generateOrdinalTestCases(true, isGreaterThan, false),
        ...generateOrdinalTestCases(false, isLessThan, true),
        ...generateOrdinalTestCases(false, isEqualTo, false),
        ...generateStringTestCases('123', isEqualTo, '123'),
        ...generateStringTestCases('123', doesntContain, '124'),
        ...generateStringTestCases('123', startsWith, '12'),
        ...generateStringTestCases('123', endsWith, '23'),
        ...generateStringTestCases('123', contains, '2'),
        ...generateStringTestCases(true, isEqualTo, true),
        ...generateStringTestCases(false, isEqualTo, false),
        ...generateStringTestCases('[1,2,3]', contains, '2'),
        ...generateStringTestCases('[1,2,3]', doesntContain, ','),
        ...generateStringTestCases('How are you', doesntContain, 'y'), // y => true, 'How are you' doesnt contain 'true'
        {
            code: '{bool;{eval};{eval}op;{eval}}',
            expected: '`Invalid operator`',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) },
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 22, end: 28, error: new MarkerError('eval', 22) },
                { start: 0, end: 29, error: new InvalidOperatorError('op') }
            ]
        }
    ]
});

function generateOrdinalTestCases(left: boolean | string, tests: Record<bbtagUtil.OrdinalOperator, boolean>, right: boolean | string): SubtagTestCase[] {
    const leftStrs = typeof left === 'boolean' ? left ? ['true', 't', 'yes', 'y'] : ['false', 'f', 'no', 'n'] : [left];
    const rightStrs = typeof right === 'boolean' ? right ? ['true', 't', 'yes', 'y'] : ['false', 'f', 'no', 'n'] : [right];

    return Object.entries(tests).filter(x => bbtagUtil.isOrdinalOperator(x[0])).flatMap(([op, expected]) => {
        const expectedStr = expected.toString();

        return leftStrs.flatMap(l => rightStrs.flatMap(r => [
            { code: `{bool;${l};${op};${r}}`, expected: expectedStr },
            { code: `{bool;${op};${l};${r}}`, expected: expectedStr },
            { code: `{bool;${l};${r};${op}}`, expected: expectedStr }
        ]));
    });
}

function generateStringTestCases(left: boolean | string, tests: Record<bbtagUtil.StringOperator, boolean>, right: boolean | string): SubtagTestCase[] {
    const leftStrs = typeof left === 'boolean' ? left ? ['true', 't', 'yes', 'y'] : ['false', 'f', 'no', 'n'] : [left];
    const rightStrs = typeof right === 'boolean' ? right ? ['true', 't', 'yes', 'y'] : ['false', 'f', 'no', 'n'] : [right];

    return Object.entries(tests).filter(x => bbtagUtil.isStringOperator(x[0])).flatMap(([op, expected]) => {
        const expectedStr = expected.toString();

        return leftStrs.flatMap(l => rightStrs.flatMap(r => [
            { code: `{bool;${l};${op};${r}}`, expected: expectedStr },
            { code: `{bool;${op};${l};${r}}`, expected: expectedStr },
            { code: `{bool;${l};${r};${op}}`, expected: expectedStr }
        ]));
    });
}

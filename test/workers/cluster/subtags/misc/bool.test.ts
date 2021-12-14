import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { BoolSubtag } from '@cluster/subtags/misc/bool';

import { runSubtagTests, SubtagTestCase, TestError } from '../SubtagTestSuite';

const isEqualTo = { '!=': false, '<': false, '<=': true, '==': true, '>': false, '>=': true } as const;
const isGreaterThan = { '!=': true, '<': false, '<=': false, '==': false, '>': true, '>=': true } as const;
const isLessThan = { '!=': true, '<': true, '<=': true, '==': false, '>': false, '>=': false } as const;

runSubtagTests({
    subtag: new BoolSubtag(),
    cases: [
        {
            code: '{bool}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(3, 0) }
            ]
        },
        {
            code: '{bool;{error}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 6, end: 13, error: new TestError(6) },
                { start: 0, end: 14, error: new NotEnoughArgumentsError(3, 1) }
            ]
        },
        {
            code: '{bool;{error};{error}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 6, end: 13, error: new TestError(6) },
                { start: 14, end: 21, error: new TestError(14) },
                { start: 0, end: 22, error: new NotEnoughArgumentsError(3, 2) }
            ]
        },
        ...generateTestCases('123', isEqualTo, '123'),
        ...generateTestCases('123', isGreaterThan, '122'),
        ...generateTestCases('123', isLessThan, '124'),
        ...generateTestCases('abc', isGreaterThan, '123'),
        ...generateTestCases('test22abc', isLessThan, 'test100abc'),
        ...generateTestCases('test100abc', isGreaterThan, 'test90abc'),
        ...generateTestCases('test100abc', isEqualTo, 'test0100abc'),
        ...generateTestCases(true, isEqualTo, true),
        ...generateTestCases(true, isGreaterThan, false),
        ...generateTestCases(false, isLessThan, true),
        ...generateTestCases(false, isEqualTo, false),
        {
            code: '{bool;{error};{error};{error}}',
            expected: '`Invalid operator`',
            errors: [
                { start: 6, end: 13, error: new TestError(6) },
                { start: 14, end: 21, error: new TestError(14) },
                { start: 22, end: 29, error: new TestError(22) },
                { start: 0, end: 30, error: new BBTagRuntimeError('Invalid operator') }
            ]
        },
        {
            code: '{bool;{error};{error};{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 13, error: new TestError(6) },
                { start: 14, end: 21, error: new TestError(14) },
                { start: 22, end: 29, error: new TestError(22) },
                { start: 30, end: 37, error: new TestError(30) },
                { start: 0, end: 38, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});

function generateTestCases(left: boolean | string, tests: Record<string, boolean>, right: boolean | string): SubtagTestCase[] {
    const leftStrs = typeof left === 'boolean' ? left ? ['true', 't', 'yes', 'y'] : ['false', 'f', 'no', 'n'] : [left];
    const rightStrs = typeof right === 'boolean' ? right ? ['true', 't', 'yes', 'y'] : ['false', 'f', 'no', 'n'] : [right];

    return Object.entries(tests).flatMap(([op, expected]) => {
        const expectedStr = expected.toString();

        return leftStrs.flatMap(l => rightStrs.flatMap(r => [
            { code: `{bool;${l};${op};${r}}`, expected: expectedStr },
            { code: `{bool;${op};${l};${r}}`, expected: expectedStr },
            { code: `{bool;${l};${r};${op}}`, expected: expectedStr }
        ]));
    });
}

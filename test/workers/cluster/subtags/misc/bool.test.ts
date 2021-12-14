import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { BoolSubtag } from '@cluster/subtags/misc/bool';

import { MarkerError, runSubtagTests, SubtagTestCase } from '../SubtagTestSuite';

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
            code: '{bool;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError(6) },
                { start: 0, end: 13, error: new NotEnoughArgumentsError(3, 1) }
            ]
        },
        {
            code: '{bool;{eval};{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError(6) },
                { start: 13, end: 19, error: new MarkerError(13) },
                { start: 0, end: 20, error: new NotEnoughArgumentsError(3, 2) }
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
            code: '{bool;{eval};{eval};{eval}}',
            expected: '`Invalid operator`',
            errors: [
                { start: 6, end: 12, error: new MarkerError(6) },
                { start: 13, end: 19, error: new MarkerError(13) },
                { start: 20, end: 26, error: new MarkerError(20) },
                { start: 0, end: 27, error: new BBTagRuntimeError('Invalid operator') }
            ]
        },
        {
            code: '{bool;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError(6) },
                { start: 13, end: 19, error: new MarkerError(13) },
                { start: 20, end: 26, error: new MarkerError(20) },
                { start: 27, end: 33, error: new MarkerError(27) },
                { start: 0, end: 34, error: new TooManyArgumentsError(3, 4) }
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

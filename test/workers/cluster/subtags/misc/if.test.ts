import { BBTagRuntimeError, NotABooleanError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { IfSubtag } from '@cluster/subtags/misc/if';

import { runSubtagTests, SubtagTestCase, TestError } from '../SubtagTestSuite';

const isEqualTo = { '!=': false, '<': false, '<=': true, '==': true, '>': false, '>=': true } as const;
const isGreaterThan = { '!=': true, '<': false, '<=': false, '==': false, '>': true, '>=': true } as const;
const isLessThan = { '!=': true, '<': true, '<=': true, '==': false, '>': false, '>=': false } as const;

runSubtagTests({
    subtag: new IfSubtag(),
    cases: [
        {
            code: '{if}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 4, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{if;{error}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 4, end: 11, error: new TestError(4) },
                { start: 0, end: 12, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        {
            code: '{if;aaaa;{error}}',
            expected: '`Not a boolean`',
            errors: [
                // <then> is not executed
                { start: 0, end: 17, error: new NotABooleanError('aaaa') }
            ]
        },
        {
            code: '{if;aaaa;{error};{error}}',
            expected: '`Not a boolean`',
            errors: [
                // <then> is not executed
                // [else] is not executed
                { start: 0, end: 25, error: new NotABooleanError('aaaa') }
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
            code: '{if;{error};{error};{error};{error}}',
            expected: '`Invalid operator`',
            errors: [
                { start: 4, end: 11, error: new TestError(4) },   // <left> is executed
                { start: 12, end: 19, error: new TestError(12) }, // <operator> is executed
                { start: 20, end: 27, error: new TestError(20) }, // <right> is executed
                //                                                   <then> is not executed
                { start: 0, end: 36, error: new BBTagRuntimeError('Invalid operator') }
            ]
        },
        {
            code: '{if;{error};{error};{error};{error};{error}}',
            expected: '`Invalid operator`',
            errors: [
                { start: 4, end: 11, error: new TestError(4) },   // <left> is executed
                { start: 12, end: 19, error: new TestError(12) }, // <operator> is executed
                { start: 20, end: 27, error: new TestError(20) }, // <right> is executed
                //                                                   <then> is not executed
                //                                                   [else] is not executed
                { start: 0, end: 44, error: new BBTagRuntimeError('Invalid operator') }
            ]
        },
        {
            code: '{if;{error};{error};{error};{error};{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 4, end: 11, error: new TestError(4) },   // <left> is executed
                { start: 12, end: 19, error: new TestError(12) }, // <operator> is executed
                { start: 20, end: 27, error: new TestError(20) }, // <right> is executed
                //                                                   <then> is not executed
                //                                                   [else] is not executed
                { start: 44, end: 51, error: new TestError(44) }, // excess argument is executed
                { start: 0, end: 52, error: new TooManyArgumentsError(5, 6) }
            ]
        }
    ]
});

function generateTestCases(left: boolean | string, tests: Record<string, boolean>, right: boolean | string): SubtagTestCase[] {
    const leftStrs = typeof left === 'boolean' ? left ? ['true', 't', 'yes', 'y'] : ['false', 'f', 'no', 'n'] : [left];
    const rightStrs = typeof right === 'boolean' ? right ? ['true', 't', 'yes', 'y'] : ['false', 'f', 'no', 'n'] : [right];

    return Object.entries(tests).flatMap(([op, expected]) => {
        const ifTrue = expected ? 'Success!' : '{error}';
        const ifFalse = !expected ? 'Success!' : '{error}';

        return leftStrs.flatMap(l => rightStrs.flatMap(r => [
            { code: `{if;${l};${op};${r};${ifTrue};${ifFalse}}`, expected: 'Success!' },
            { code: `{if;${op};${l};${r};${ifTrue};${ifFalse}}`, expected: 'Success!' },
            { code: `{if;${l};${r};${op};${ifTrue};${ifFalse}}`, expected: 'Success!' },
            { code: `{if;${l};${op};${r};${ifTrue}}`, expected: expected ? 'Success!' : '' },
            { code: `{if;${op};${l};${r};${ifTrue}}`, expected: expected ? 'Success!' : '' },
            { code: `{if;${l};${r};${op};${ifTrue}}`, expected: expected ? 'Success!' : '' }
        ]));
    });
}

import { BBTagRuntimeError, NotABooleanError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { IfSubtag } from '@cluster/subtags/misc/if';

import { MarkerError, runSubtagTests, SubtagTestCase } from '../SubtagTestSuite';

const isEqualTo = { '!=': false, '<': false, '<=': true, '==': true, '>': false, '>=': true } as const;
const isGreaterThan = { '!=': true, '<': false, '<=': false, '==': false, '>': true, '>=': true } as const;
const isLessThan = { '!=': true, '<': true, '<=': true, '==': false, '>': false, '>=': false } as const;

runSubtagTests({
    subtag: new IfSubtag(),
    cases: [
        /* {if} */
        {
            code: '{if}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 4, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        /* {if;<bool>} */
        {
            code: '{if;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 4, end: 10, error: new MarkerError(4) },
                { start: 0, end: 11, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        /* {if;<bool>;<then>} */
        {
            code: '{if;aaaa;{fail}}',
            expected: '`Not a boolean`',
            errors: [
                // <then> is not executed
                { start: 0, end: 16, error: new NotABooleanError('aaaa') }
            ]
        },
        {
            code: '{if;true;{eval}Success!}',
            expected: 'Success!',
            errors: [
                { start: 9, end: 15, error: new MarkerError(9) } // <then> is executed
            ]
        },
        {
            code: '{if;false;{fail}}',
            expected: ''
            // <then> is not executed
        },
        /* {if;<bool>;<then>;[else]} */
        {
            code: '{if;aaaa;{fail};{fail}}',
            expected: '`Not a boolean`',
            errors: [
                // <then> is not executed
                // [else] is not executed
                { start: 0, end: 23, error: new NotABooleanError('aaaa') }
            ]
        },
        {
            code: '{if;true;{eval}Success!;{fail}}',
            expected: 'Success!',
            errors: [
                { start: 9, end: 15, error: new MarkerError(9) } // <then> is executed
                //                                                [else] is not executed
            ]
        },
        {
            code: '{if;false;{fail};{eval}Success!}',
            expected: 'Success!',
            errors: [
                { start: 17, end: 23, error: new MarkerError(17) } // [else] is executed
            ]
        },
        /* {if;<left>;<operator>;<right>;<then>} */
        {
            code: '{if;a;==;a;{eval}Success!}',
            expected: 'Success!',
            errors: [
                { start: 11, end: 17, error: new MarkerError(11) } // <then> is executed
            ]
        },
        {
            code: '{if;a;!=;a;{fail}}',
            expected: ''
            // <then> is not executed
        },
        {
            code: '{if;{eval};{eval};{eval};{fail}}',
            expected: '`Invalid operator`',
            errors: [
                { start: 4, end: 10, error: new MarkerError(4) },   // <left> is executed
                { start: 11, end: 17, error: new MarkerError(11) }, // <operator> is executed
                { start: 18, end: 24, error: new MarkerError(18) }, // <right> is executed
                //                                                   <then> is not executed
                { start: 0, end: 32, error: new BBTagRuntimeError('Invalid operator') }
            ]
        },
        /* {if;<left>;<operator>;<right>;<then>;[else]} */
        {
            code: '{if;a;==;a;{eval}Success!;{fail}}',
            expected: 'Success!',
            errors: [
                { start: 11, end: 17, error: new MarkerError(11) }  // <then> is executed
                //                                                   [else] is not executed
            ]
        },
        {
            code: '{if;a;!=;a;{fail};{eval}Success!}',
            expected: 'Success!',
            errors: [
                //                                                  <then> is not executed
                { start: 18, end: 24, error: new MarkerError(18) } // [else] is executed
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
            code: '{if;{eval};{eval};{eval};{fail};{fail}}',
            expected: '`Invalid operator`',
            errors: [
                { start: 4, end: 10, error: new MarkerError(4) },   // <left> is executed
                { start: 11, end: 17, error: new MarkerError(11) }, // <operator> is executed
                { start: 18, end: 24, error: new MarkerError(18) }, // <right> is executed
                //                                                   <then> is not executed
                //                                                   [else] is not executed
                { start: 0, end: 39, error: new BBTagRuntimeError('Invalid operator') }
            ]
        },
        /* {if;<left>;<operator>;<right>;<then>;[else];--EXCESS--} */
        {
            code: '{if;{eval};{eval};{eval};{fail};{fail};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 4, end: 10, error: new MarkerError(4) },   // <left> is executed
                { start: 11, end: 17, error: new MarkerError(11) }, // <operator> is executed
                { start: 18, end: 24, error: new MarkerError(18) }, // <right> is executed
                //                                                   <then> is not executed
                //                                                   [else] is not executed
                { start: 39, end: 45, error: new MarkerError(39) }, // excess argument is executed
                { start: 0, end: 46, error: new TooManyArgumentsError(5, 6) }
            ]
        }
    ]
});

function generateTestCases(left: boolean | string, tests: Record<string, boolean>, right: boolean | string): SubtagTestCase[] {
    const leftStrs = typeof left === 'boolean' ? left ? ['true', 't', 'yes', 'y'] : ['false', 'f', 'no', 'n'] : [left];
    const rightStrs = typeof right === 'boolean' ? right ? ['true', 't', 'yes', 'y'] : ['false', 'f', 'no', 'n'] : [right];

    return Object.entries(tests).flatMap(([op, expected]) => {
        const ifTrue = expected ? 'Success!' : '{fail}';
        const ifFalse = !expected ? 'Success!' : '{fail}';

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

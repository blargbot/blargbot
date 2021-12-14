import { BBTagRuntimeError, NotABooleanError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { IfSubtag } from '@cluster/subtags/misc/if';

import { runSubtagTests, SubtagTestCase, TestError } from '../SubtagTestSuite';

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
            code: '{if;{error}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 4, end: 11, error: new TestError(4) },
                { start: 0, end: 12, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        /* {if;<bool>;<then>} */
        {
            code: '{if;aaaa;{error}}',
            expected: '`Not a boolean`',
            errors: [
                // <then> is not executed
                { start: 0, end: 17, error: new NotABooleanError('aaaa') }
            ]
        },
        {
            code: '{if;true;{error}Success!}',
            expected: 'Success!',
            errors: [
                { start: 9, end: 16, error: new TestError(9) } // <then> is executed
            ]
        },
        {
            code: '{if;false;{error}Failed!}',
            expected: ''
            // <then> is not executed
        },
        /* {if;<bool>;<then>;[else]} */
        {
            code: '{if;aaaa;{error};{error}}',
            expected: '`Not a boolean`',
            errors: [
                // <then> is not executed
                // [else] is not executed
                { start: 0, end: 25, error: new NotABooleanError('aaaa') }
            ]
        },
        {
            code: '{if;true;{error}Success!;{error}Failed!}',
            expected: 'Success!',
            errors: [
                { start: 9, end: 16, error: new TestError(9) } // <then> is executed
                //                                                [else] is not executed
            ]
        },
        {
            code: '{if;false;{error}Failed!;{error}Success!}',
            expected: 'Success!',
            errors: [
                //                                                  <then> is not executed
                { start: 25, end: 32, error: new TestError(25) } // [else] is executed
            ]
        },
        /* {if;<left>;<operator>;<right>;<then>} */
        {
            code: '{if;a;==;a;{error}Success!}',
            expected: 'Success!',
            errors: [
                { start: 11, end: 18, error: new TestError(11) } // <then> is executed
            ]
        },
        {
            code: '{if;a;!=;a;{error}Failed!}',
            expected: ''
            // <then> is not executed
        },
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
        /* {if;<left>;<operator>;<right>;<then>;[else]} */
        {
            code: '{if;a;==;a;{error}Success!;{error}Failed!}',
            expected: 'Success!',
            errors: [
                { start: 11, end: 18, error: new TestError(11) }  // <then> is executed
                //                                                   [else] is not executed
            ]
        },
        {
            code: '{if;a;!=;a;{error}Failed!;{error}Success!}',
            expected: 'Success!',
            errors: [
                //                                                  <then> is not executed
                { start: 26, end: 33, error: new TestError(26) } // [else] is executed
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
        /* {if;<left>;<operator>;<right>;<then>;[else];--EXCESS--} */
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

import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { BrainfuckSubtag } from '@cluster/subtags/misc/brainfuck';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new BrainfuckSubtag(),
    cases: [
        {
            code: '{brainfuck}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 11, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{brainfuck;-[------->+<]>-.-[->+++++<]>++.+++++++..+++.[--->+<]>-----.---[->+++<]>.-[--->+<]>---.+++.------.--------.-[--->+<]>.}',
            expected: 'Hello World!'
        },
        {
            code: '{brainfuck;+[>,]+[<.-];This is a test}',
            expected: 'tset a si sihT\u0001'
        },
        {
            code: '{brainfuck;{eval}}',
            expected: '`No valid input given`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 0, end: 18, error: new BBTagRuntimeError('No valid input given') }
            ]
        },
        {
            code: '{brainfuck;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 18, end: 24, error: new MarkerError('eval', 18) },
                { start: 25, end: 31, error: new MarkerError('eval', 25) },
                { start: 0, end: 32, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});

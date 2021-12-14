import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { BrainfuckSubtag } from '@cluster/subtags/misc/brainfuck';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

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
            code: '{brainfuck;{error};{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 18, error: new TestError(11) },
                { start: 19, end: 26, error: new TestError(19) },
                { start: 27, end: 34, error: new TestError(27) },
                { start: 0, end: 35, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});

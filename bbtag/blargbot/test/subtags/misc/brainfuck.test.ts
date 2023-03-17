import { BBTagRuntimeError } from '@bbtag/blargbot';
import { BrainfuckSubtag } from '@bbtag/blargbot/subtags';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: BrainfuckSubtag,
    argCountBounds: { min: 1, max: 2 },
    cases: [
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
        }
    ]
});

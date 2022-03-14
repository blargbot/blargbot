import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { BrainfuckSubtag } from '@blargbot/cluster/subtags/misc/brainfuck';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new BrainfuckSubtag(),
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

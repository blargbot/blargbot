import { BBTagRuntimeError } from '@blargbot/bbtag';
import { BrainfuckSubtag } from '@blargbot/bbtag/subtags';
import { default as Brainfuck } from 'brainfuck-node';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const bf = new Brainfuck();

await runSubtagTests({
    subtag: new BrainfuckSubtag({
        executeBrainfuck(code, input) {
            return Promise.resolve(bf.execute(code, input).output);
        }
    }),
    argCountBounds: { min: 1, max: 2 },
    names: ['brainfuck'],
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
                { error: new BBTagRuntimeError('No valid input given') }
            ]
        }
    ]
});

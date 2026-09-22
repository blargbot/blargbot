import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';
import Brainfuck from 'brainfuck-node';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.brainfuckReplacer,
    argCountBounds: { min: 1, max: 2 },
    setup(context) {
        context.locals.setup(m => m.brainfuck).returns((code, input) => {
            return new Brainfuck().execute(code, input).output;
        });
    },
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

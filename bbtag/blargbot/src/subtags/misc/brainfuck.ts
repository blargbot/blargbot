import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { BrainfuckPlugin } from '../../plugins/BrainfuckPlugin.js';
import { p } from '../p.js';

export class BrainfuckSubtag extends Subtag {
    public constructor() {
        super({
            name: 'brainfuck'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.plugin(BrainfuckPlugin))
        .parameter(p.string('code'))
        .parameter(p.string('input').optional(''))
    public runBrainfuck(brainfuck: BrainfuckPlugin, code: string, input: string): string {
        try {
            return brainfuck.eval(code, input);
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw new BBTagRuntimeError('Unexpected error from brainfuck');
        }
    }
}

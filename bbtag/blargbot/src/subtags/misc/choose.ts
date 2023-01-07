import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag, transparentResultAdapter } from '@bbtag/subtag';

import { p } from '../p.js';

export class ChooseSubtag extends Subtag {
    public constructor() {
        super({
            name: 'choose'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.int('choice'))
        .parameter(p.deferred('options').repeat(1))
        .convertResultUsing(transparentResultAdapter)
    public choose<T>(index: number, options: Array<() => T>): T {
        if (index < 0)
            throw new BBTagRuntimeError('Choice cannot be negative');

        if (index >= options.length)
            throw new BBTagRuntimeError('Index out of range');

        return options[index]();
    }
}

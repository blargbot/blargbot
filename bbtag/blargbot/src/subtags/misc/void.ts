import type { InterruptableProcess } from '@bbtag/engine';
import { Subtag, transparentResultAdapter } from '@bbtag/subtag';

import { p } from '../p.js';

export class VoidSubtag extends Subtag {
    public constructor() {
        super({
            name: 'void',
            aliases: ['null']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.deferred('code').repeat())
        .useConversion(transparentResultAdapter)
    public async * execute(args: Array<() => InterruptableProcess<string>>): InterruptableProcess<''> {
        for (const arg of args)
            yield* arg();
        return '';
    }
}

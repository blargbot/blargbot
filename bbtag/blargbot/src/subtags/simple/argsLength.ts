import type { BBTagScript } from '@bbtag/engine';
import { numberResultAdapter, Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class ArgsLengthSubtag extends Subtag {
    public constructor() {
        super({
            name: 'argsLength'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.script)
        .convertResultUsing(numberResultAdapter)
    public getArgsLength(context: BBTagScript): number {
        return context.options.args.length;
    }
}

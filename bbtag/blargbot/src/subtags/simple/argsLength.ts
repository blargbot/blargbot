import type { BBTagScript } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class ArgsLengthSubtag extends Subtag {
    public constructor() {
        super({
            name: 'argsLength'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'number' })
        .parameter(p.script)
    public getArgsLength(context: BBTagScript): number {
        return context.options.args.length;
    }
}

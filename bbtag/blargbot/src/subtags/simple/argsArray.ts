import type { BBTagScript } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class ArgsArraySubtag extends Subtag {
    public constructor() {
        super({
            name: 'argsArray'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string[]' })
        .parameter(p.script)
    public getInput(context: BBTagScript): string[] {
        return context.options.args;
    }
}

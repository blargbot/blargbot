import type { BBTagScript } from '@bbtag/engine';
import { arrayResultAdapter, Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class ArgsArraySubtag extends Subtag {
    public constructor() {
        super({
            name: 'argsArray'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.script)
        .convertResultUsing(arrayResultAdapter)
    public getInput(context: BBTagScript): string[] {
        return context.options.args;
    }
}

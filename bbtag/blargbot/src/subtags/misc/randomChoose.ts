import { Subtag, transparentResultAdapter } from '@bbtag/subtag';

import type { BBTagArrayRef } from '../../plugins/ArrayPlugin.js';
import type { BBTagVariableValue } from '../../plugins/VariablesPlugin.js';
import { jsonResultAdapter } from '../../results/jsonResultAdapter.js';
import { p } from '../p.js';

export class RandomChooseSubtag extends Subtag {
    public constructor() {
        super({
            name: 'randomChoose',
            aliases: ['randChoose']
        });
    }

    @Subtag.signature({ id: 'args' })
        .parameter(p.deferred('choices').repeat(2, Infinity))
        .convertResultUsing(transparentResultAdapter)
    public randChooseArg<T>(choices: Array<() => T>): T {
        const index = Math.floor(Math.random() * choices.length);
        return choices[index]();
    }

    @Subtag.signature({ id: 'array' })
        .parameter(p.array('choices'))
        .convertResultUsing(jsonResultAdapter)
    public randChoose({ v: choices }: BBTagArrayRef): BBTagVariableValue {
        const index = Math.floor(Math.random() * choices.length);
        return choices[index];
    }

    @Subtag.signature({ id: 'single' })
        .parameter(p.string('choices'))
    public randChooseSingle(value: string): string {
        return value;
    }
}

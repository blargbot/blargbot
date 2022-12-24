import { Subtag } from '@bbtag/subtag';

import type { BBTagArrayRef } from '../../plugins/ArrayPlugin.js';
import SubtagVariableResult from '../../results/SubtagVariableResult.js';
import { p } from '../p.js';

export class RandomChooseSubtag extends Subtag {
    public constructor() {
        super({
            name: 'randomChoose',
            aliases: ['randChoose']
        });
    }

    @Subtag.signature({ id: 'args', returns: 'transparent' })
        .parameter(p.deferred('choices').repeat(2, Infinity))
    public randChooseArg<T>(choices: Array<() => T>): T {
        const index = Math.floor(Math.random() * choices.length);
        return choices[index]();
    }

    @Subtag.signature({ id: 'array', returns: SubtagVariableResult })
        .parameter(p.array('choices'))
    public randChoose({ v: choices }: BBTagArrayRef): JToken {
        const index = Math.floor(Math.random() * choices.length);
        return choices[index];
    }

    @Subtag.signature({ id: 'single', returns: 'string' })
        .parameter(p.string('choices'))
    public randChooseSingle(value: string): string {
        return value;
    }
}

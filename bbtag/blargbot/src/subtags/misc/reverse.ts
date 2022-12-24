import { Subtag } from '@bbtag/subtag';

import { ArrayPlugin } from '../../plugins/ArrayPlugin.js';
import { VariablesPlugin } from '../../plugins/VariablesPlugin.js';
import { p } from '../p.js';

export class ReverseSubtag extends Subtag {
    public constructor() {
        super({
            name: 'reverse'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(VariablesPlugin))
        .parameter(p.string('text'))
    public async reverse(array: ArrayPlugin, variables: VariablesPlugin, input: string): Promise<string> {
        const arr = array.parseArray(input);
        if (arr === undefined)
            return input.split('').reverse().join('');

        const result = [...arr.v].reverse();
        if (arr.n === undefined)
            return array.serialize(result);

        await variables.set(arr.n, arr.v);
        return '';
    }
}

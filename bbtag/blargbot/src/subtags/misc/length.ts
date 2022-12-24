import { Subtag } from '@bbtag/subtag';

import { ArrayPlugin } from '../../plugins/ArrayPlugin.js';
import { p } from '../p.js';

export class LengthSubtag extends Subtag {
    public constructor() {
        super({
            name: 'length'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'number' })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.string('value'))
    public getLength(array: ArrayPlugin, value: string): number {
        const deserializedArray = array.parseArray(value);
        if (deserializedArray !== undefined)
            return deserializedArray.v.length;
        return value.length;
    }
}

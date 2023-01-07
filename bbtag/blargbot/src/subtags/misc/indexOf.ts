import { numberResultAdapter, Subtag } from '@bbtag/subtag';

import { ArrayPlugin } from '../../plugins/ArrayPlugin.js';
import { p } from '../p.js';

export class IndexOfSubtag extends Subtag {
    public constructor() {
        super({
            name: 'indexOf'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.string('text|array'))
        .parameter(p.string('searchFor'))
        .parameter(p.int('start').tryFallback().optional(0))
        .convertResultUsing(numberResultAdapter)
    public indexOf(array: ArrayPlugin, text: string, query: string, from: number): number {
        const { v: input } = array.parseArray(text) ?? { v: text };
        return input.indexOf(query, from);
    }
}

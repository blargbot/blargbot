import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { ArrayPlugin } from '../../plugins/ArrayPlugin.js';
import { ColorPlugin } from '../../plugins/ColorPlugin.js';
import { VariablesPlugin } from '../../plugins/VariablesPlugin.js';
import { p } from '../p.js';

export class ColorSubtag extends Subtag {
    public constructor() {
        super({
            name: 'color'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.plugin(ColorPlugin))
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(VariablesPlugin))
        .parameter(p.string('color'))
        .parameter(p.string('outputFormat').optional(''))
        .parameter(p.const(''))
    @Subtag.signature({ id: 'convert', returns: 'string' })
        .parameter(p.plugin(ColorPlugin))
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(VariablesPlugin))
        .parameter(p.string('color'))
        .parameter(p.string('outputFormat'))
        .parameter(p.string('inputFormat'))
    public async convertColor(
        color: ColorPlugin,
        array: ArrayPlugin,
        variables: VariablesPlugin,
        value: string,
        from: string,
        to: string
    ): Promise<string> {
        if (value.length === 0)
            throw new BBTagRuntimeError('Invalid color', 'value was empty');

        const v = array.parseArray(value) ?? await variables.get(value) ?? value;
        const arr = typeof v === 'object' ? Array.isArray(v) ? v : 'v' in v && Array.isArray(v.v) ? v.v : undefined : undefined;
        value = arr?.map(e => e?.toString()).join(',') ?? value;

        const reader = color.getReader(from);
        if (reader === undefined)
            throw new BBTagRuntimeError('Invalid input method', `${JSON.stringify(from)} is not valid`);

        const writer = reader(value);
        if (writer === undefined)
            throw new BBTagRuntimeError('Invalid color', `${JSON.stringify(value)} is not a valid color`);

        const result = writer(to);
        if (result === undefined)
            throw new BBTagRuntimeError('Invalid output method', `${JSON.stringify(to)} is not valid`);

        return result;
    }
}

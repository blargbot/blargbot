import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { JsonPlugin } from '../../plugins/JsonPlugin.js';
import type { BBTagVariableValue } from '../../plugins/VariablesPlugin.js';
import { jsonResultAdapter } from '../../results/jsonResultAdapter.js';
import { p } from '../p.js';

export class JsonSubtag extends Subtag {
    public constructor() {
        super({
            name: 'json',
            aliases: ['j']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(JsonPlugin))
        .parameter(p.raw('input').optional('{}'))
        .useConversion(jsonResultAdapter)
    public parse(json: JsonPlugin, input: string): BBTagVariableValue {
        const result = json.parse(input);
        if (result === undefined)
            throw new BBTagRuntimeError('Invalid JSON provided');
        return result;
    }
}

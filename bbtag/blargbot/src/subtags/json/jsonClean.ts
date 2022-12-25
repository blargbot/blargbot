import { Subtag } from '@bbtag/subtag';

import { JsonPlugin } from '../../plugins/JsonPlugin.js';
import type { BBTagVariableValue } from '../../plugins/VariablesPlugin.js';
import { VariablesPlugin } from '../../plugins/VariablesPlugin.js';
import { jsonResultAdapter } from '../../results/jsonResultAdapter.js';
import { p } from '../p.js';

export class JsonCleanSubtag extends Subtag {
    public constructor() {
        super({
            name: 'jsonClean',
            aliases: ['jClean']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(JsonPlugin))
        .parameter(p.plugin(VariablesPlugin))
        .parameter(p.string('input').optional('{}'))
        .useConversion(jsonResultAdapter)
    public async cleanJson(json: JsonPlugin, variables: VariablesPlugin, input: string): Promise<BBTagVariableValue> {
        let value = json.parse(input);
        if (value === undefined) {
            value = await variables.get(input) ?? {};
            if (typeof value === 'string')
                value = json.parse(value) ?? value;
        }

        return this.#clean(json, value);
    }

    #clean(json: JsonPlugin, value: BBTagVariableValue): BBTagVariableValue {
        switch (typeof value) {
            case 'string': return json.parse(value) ?? value;
            case 'object': {
                if (value === null)
                    return value;
                if (Array.isArray(value))
                    return value.map(v => this.#clean(json, v));
                if ('v' in value && Array.isArray(value.v) && (!('n' in value) || typeof value.n === 'string'))
                    return value.v.map(v => this.#clean(json, v));
                return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, this.#clean(json, value)]));
            }
            default:
                return value;
        }
    }
}

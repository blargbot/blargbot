import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { bbtag, SubtagType } from '../../utils';

export class JsonValuesSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'jsonvalues',
            category: SubtagType.JSON,
            aliases: ['jvalues'],
            definition: [
                {
                    parameters: ['object:{}#10000000', 'path?'],
                    description: 'Retrieves all values from provided the JSON object. ' +
                        '`object` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n' +
                        '`path` is a dot-noted series of properties.',
                    exampleCode: '{set;~json;{json;{"key": "value", "key2" : "value2"}}\n'
                        + '{jsonvalues;~json}',
                    exampleOut: '["value","value2"]',
                    returns: 'json',
                    execute: (ctx, [input, path]) => this.getJsonValue(ctx, input.value, path.value)
                }
            ]
        });
    }

    public async getJsonValue(context: BBTagContext, input: string, path: string): Promise<JToken> {
        const obj = (await bbtag.json.resolveObj(context, input)).object;

        if (path !== '')
            return Object.values(bbtag.json.get(obj, path) ?? {});

        return Object.values(obj);
    }
}

import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtagUtil, SubtagType } from '@cluster/utils';

const json = bbtagUtil.json;

export class JsonValuesSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'jsonvalues',
            category: SubtagType.JSON,
            aliases: ['jvalues'],
            definition: [
                {
                    parameters: ['object', 'path?'],
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
        try {
            const arr = await bbtagUtil.tagArray.getArray(context, input);
            const obj = arr?.v ?? (await json.resolve(context, input)).object;

            if (path !== '')
                return Object.values(json.get(obj, path) ?? []);

            return Object.values(obj);

        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw e;
        }
    }
}

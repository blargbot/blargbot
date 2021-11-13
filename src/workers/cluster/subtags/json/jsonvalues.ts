import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtagUtil, SubtagType } from '@cluster/utils';

const json = bbtagUtil.json;

export class JsonValuesSubtag extends Subtag {
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
                    execute: async (context, [{ value: input }, { value: path }]): Promise<string | void> => {
                        try {
                            let obj: JObject | JArray;
                            const arr = await bbtagUtil.tagArray.getArray(context, input);
                            if (arr !== undefined && Array.isArray(arr.v))
                                obj = arr.v;
                            else
                                obj = (await json.parse(context, input)).object;
                            if (path !== '') {
                                const objAtPath = json.get(obj, path);
                                if ((typeof objAtPath === 'object' || typeof objAtPath === 'string') && objAtPath !== null)
                                    return JSON.stringify(Object.values(objAtPath));
                            }
                            return JSON.stringify(Object.values(obj));

                        } catch (e: unknown) {
                            if (e instanceof Error)
                                throw new BBTagRuntimeError(e.message);
                        }
                    }
                }
            ]
        });
    }
}

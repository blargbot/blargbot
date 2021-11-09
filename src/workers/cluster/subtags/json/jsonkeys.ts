import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtagUtil, SubtagType } from '@cluster/utils';

const json = bbtagUtil.json;

export class JsonKeysSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'jsonkeys',
            category: SubtagType.JSON,
            aliases: ['jkeys'],
            definition: [
                {
                    parameters: ['object', 'path?'],
                    description: 'Retrieves all keys from provided the JSON object. ' +
                        '`object` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n' +
                        '`path` is a dot-noted series of properties.',
                    exampleCode: '{set;~json;{json;{"key": "value", "key2" : "value2"}}\n' +
                        '{jsonkeys;~json}',
                    exampleOut: '["key","key2"]',
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
                                return JSON.stringify(Object.keys(objAtPath ?? {}));
                            }
                            return JSON.stringify(Object.keys(obj));

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

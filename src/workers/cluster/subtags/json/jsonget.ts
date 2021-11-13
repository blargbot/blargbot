import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtagUtil, SubtagType } from '@cluster/utils';

const json = bbtagUtil.json;

export class JsonGetSubtag extends Subtag {
    public constructor() {
        super({
            name: 'jsonget',
            category: SubtagType.JSON,
            aliases: ['jget'],
            definition: [
                {
                    parameters: ['input', 'path?'],
                    description: 'Navigates the path of a JSON object. Works with arrays too!\n' +
                        '`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n' +
                        '`path` is a dot-noted series of properties.',
                    exampleCode: '{jsonget;{j;{\n  "array": [\n    "zero",\n    { "value": "one" },\n    "two"\n  ]\n}};array.1.value}',
                    exampleOut: 'one',
                    execute: async (context, [{ value: input }, { value: path }]): Promise<string | void> => {
                        if (input === '')
                            input = '{}';

                        let obj: JObject | JArray;
                        const arr = await bbtagUtil.tagArray.getArray(context, input);
                        if (arr !== undefined && Array.isArray(arr.v)) {
                            obj = arr.v;
                        } else {
                            obj = (await json.parse(context, input)).object;
                        }

                        try {
                            const value = json.get(obj, path);
                            if (typeof value === 'object')
                                return JSON.stringify(value);
                            else if (value !== undefined)
                                return value.toString();
                        } catch (err: unknown) {
                            if (err instanceof Error)
                                throw new BBTagRuntimeError(err.message);
                        }
                    }
                }
            ]
        });
    }
}

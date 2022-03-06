import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtagUtil, SubtagType } from '@cluster/utils';

const json = bbtagUtil.json;

export class JsonGetSubtag extends DefinedSubtag {
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
                    returns: 'json|nothing',
                    execute: (ctx, [input, path]) => this.jsonGet(ctx, input.value, path.value)
                }
            ]
        });
    }

    public async jsonGet(context: BBTagContext, input: string, path: string): Promise<JToken | undefined> {
        if (input === '')
            input = '{}';

        let obj: JObject | JArray;
        const arr = await bbtagUtil.tagArray.deserializeOrGetArray(context, input);
        if (arr !== undefined) {
            obj = arr.v;
        } else {
            obj = (await json.resolve(context, input)).object;
        }

        try {
            return json.get(obj, path);
        } catch (err: unknown) {
            if (err instanceof Error)
                throw new BBTagRuntimeError(err.message);
            throw err;
        }
    }
}

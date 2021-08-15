import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const json = bbtagUtil.json;

export class JsonStringifySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'jsonstringify',
            category: SubtagType.ARRAY,
            aliases: ['jstringify'],
            definition: [
                {
                    parameters: ['input:{}', 'indent?:4'],
                    description: 'Pretty-prints the provided JSON `input` with the provided `indent`.',
                    exampleCode: '{jsonstringify;["one","two","three"]}',
                    exampleOut: '[\n    "one",\n    "two",\n    "three"\n]',
                    execute: async (context, [{value: input}, {value: indentStr}], subtag) => {
                        const indent = parse.int(indentStr);
                        if (isNaN(indent))
                            return this.notANumber(context, subtag);

                        let obj: JObject | JArray;
                        const arr = await bbtagUtil.tagArray.getArray(context, input);
                        if (arr !== undefined && Array.isArray(arr.v)) {
                            obj = arr.v;
                        } else {
                            obj = (await json.parse(context, input)).object;
                        }
                        return JSON.stringify(obj, null, indent);
                    }
                }
            ]
        });
    }
}

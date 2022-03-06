import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const json = bbtagUtil.json;

export class JsonStringifySubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'jsonstringify',
            category: SubtagType.JSON,
            aliases: ['jstringify'],
            definition: [
                {
                    parameters: ['input:{}', 'indent?:4'],
                    description: 'Pretty-prints the provided JSON `input` with the provided `indent`.',
                    exampleCode: '{jsonstringify;["one","two","three"]}',
                    exampleOut: '[\n    "one",\n    "two",\n    "three"\n]',
                    returns: 'string',
                    execute: (ctx, [input, indent]) => this.jsonStringify(ctx, input.value, indent.value)
                }
            ]
        });
    }
    public async jsonStringify(context: BBTagContext, input: string, indentStr: string): Promise<string> {
        const indent = parse.int(indentStr, false);
        if (indent === undefined)
            throw new NotANumberError(indentStr);

        const arr = await bbtagUtil.tagArray.deserializeOrGetArray(context, input);
        const obj = arr?.v ?? (await json.resolve(context, input)).object;
        return JSON.stringify(obj, null, indent);
    }
}

import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotANumberError } from '../../errors';
import { bbtag, SubtagType } from '../../utils';

export class JsonStringifySubtag extends CompiledSubtag {
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

        const obj = (await bbtag.json.resolveObj(context, input)).object;
        return JSON.stringify(obj, null, indent);
    }
}

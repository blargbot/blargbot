import { parse } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { NotANumberError } from '../../errors/index.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class JsonStringifySubtag extends Subtag {
    public constructor() {
        super({
            name: 'jsonStringify',
            category: SubtagType.JSON,
            aliases: ['jStringify'],
            definition: [
                {
                    parameters: ['input:{}', 'indent?:4'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [input, indent]) => this.jsonStringify(ctx, input.value, indent.value)
                }
            ]
        });
    }
    public async jsonStringify(context: BBTagContext, input: string, indentStr: string): Promise<string> {
        const indent = parse.int(indentStr);
        if (indent === undefined)
            throw new NotANumberError(indentStr);

        const obj = (await bbtag.json.resolveObj(context, input)).object;
        return JSON.stringify(obj, null, indent);
    }
}

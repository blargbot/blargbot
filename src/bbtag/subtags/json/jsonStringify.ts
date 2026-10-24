import { parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesProvider } from '../../Variables.js';

const tag = templates.subtags.jsonStringify;

export class JsonStringifySubtag extends CompiledSubtag {
    readonly #variables: VariablesProvider;
    public constructor({ variables }: { variables: VariablesProvider; }) {
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
        this.#variables = variables;
    }
    public async jsonStringify(context: BBTagContext, input: string, indentStr: string): Promise<string> {
        const indent = parse.int(indentStr);
        if (indent === undefined)
            throw new NotANumberError(indentStr);

        const variables = this.#variables.forContext(context);
        const obj = (await bbtag.json.resolveObj(variables, input)).object;
        return JSON.stringify(obj, null, indent);
    }
}

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToInteger } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.jsonStringify;

type Features = VariablesFeature;
export class JsonStringifySubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }
    public async jsonStringify(context: BBTagContext, input: string, indentStr: string): Promise<string> {
        const indent = convertToInteger(indentStr);
        if (indent === undefined)
            throw new NotANumberError(indentStr);

        const variables = this.#features.variables.forContext(context);
        const obj = (await bbtag.json.resolveObj(variables, input)).object;
        return JSON.stringify(obj, null, indent);
    }
}

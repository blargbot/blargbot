import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagJsonTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.jsonStringify;

@Subtag.names('jsonStringify', 'jStringify')
@Subtag.ctorArgs(Subtag.jsonTools(), Subtag.converter())
export class JsonStringifySubtag extends CompiledSubtag {
    readonly #jsonTools: BBTagJsonTools;
    readonly #converter: BBTagValueConverter;

    public constructor(jsonTools: BBTagJsonTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.JSON,
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

        this.#jsonTools = jsonTools;
        this.#converter = converter;
    }
    public async jsonStringify(context: BBTagContext, input: string, indentStr: string): Promise<string> {
        const indent = this.#converter.int(indentStr);
        if (indent === undefined)
            throw new NotANumberError(indentStr);

        const obj = (await this.#jsonTools.resolveObj(context, input)).object;
        return JSON.stringify(obj, null, indent);
    }
}
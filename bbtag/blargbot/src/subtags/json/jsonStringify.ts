import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagJsonTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.jsonStringify;

@Subtag.id('jsonStringify', 'jStringify')
@Subtag.ctorArgs('jsonTools', 'converter')
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
    public async jsonStringify(context: BBTagScript, input: string, indentStr: string): Promise<string> {
        const indent = this.#converter.int(indentStr);
        if (indent === undefined)
            throw new NotANumberError(indentStr);

        const obj = (await this.#jsonTools.resolveObj(context.runtime, input)).object;
        return JSON.stringify(obj, null, indent);
    }
}

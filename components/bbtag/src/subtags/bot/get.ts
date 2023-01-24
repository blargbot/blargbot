import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import { tagVariableScopeProviders } from '../../tagVariableScopeProviders.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.get;

@Subtag.id('get')
@Subtag.ctorArgs(Subtag.converter())
export class GetSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['name'],
                    description: tag.value.description({ scopes: tagVariableScopeProviders }),
                    exampleCode: tag.value.exampleCode,
                    exampleOut: tag.value.exampleOut,
                    returns: 'json|nothing',
                    execute: async (ctx, [name]) => await this.get(ctx, name.value)
                },
                {
                    parameters: ['name', 'index'],
                    description: tag.index.description,
                    exampleCode: tag.index.exampleCode,
                    exampleOut: tag.index.exampleOut,
                    returns: 'json|nothing',
                    execute: async (ctx, [name, index]) => await this.getArray(ctx, name.value, index.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public async get(context: BBTagContext, variableName: string): Promise<JToken | undefined> {
        const result = await context.variables.get(variableName);
        if (!Array.isArray(result.value))
            return result.value;

        return { v: result.value, n: result.key };
    }

    public async getArray(context: BBTagContext, variableName: string, indexStr: string): Promise<JToken | undefined> {
        const result = await context.variables.get(variableName);
        if (!Array.isArray(result.value))
            return result.value;

        if (indexStr === '')
            return { v: result.value, n: result.key };

        const index = this.#converter.int(indexStr);
        if (index === undefined)
            throw new NotANumberError(indexStr);

        if (index < 0 || index >= result.value.length)
            throw new BBTagRuntimeError('Index out of range');

        return result.value[index];
    }
}

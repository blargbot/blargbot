import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import { tagVariableScopeProviders } from '../../variables/tagVariableScopeProviders.js';

const tag = textTemplates.subtags.set;

@Subtag.id('set')
@Subtag.ctorArgs('arrayTools')
export class SetSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;

    public constructor(arrayTools: BBTagArrayTools) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['name'],
                    description: tag.clear.description,
                    exampleCode: tag.clear.exampleCode,
                    exampleOut: tag.clear.exampleOut,
                    returns: 'nothing',
                    execute: async (ctx, [name]) => await ctx.runtime.variables.set(name.value, undefined)
                },
                {
                    parameters: ['name', 'value'],
                    description: tag.value.description({ scopes: tagVariableScopeProviders }),
                    exampleCode: tag.value.exampleCode,
                    exampleOut: tag.value.exampleOut,
                    returns: 'nothing',
                    execute: async (ctx, [name, value]) => await this.set(ctx, name.value, value.value)
                },
                {
                    parameters: ['name', 'values+2'],
                    description: tag.array.description,
                    exampleCode: tag.array.exampleCode,
                    exampleOut: tag.array.exampleOut,
                    returns: 'nothing',
                    execute: async (ctx, [name, ...values]) => await this.setArray(ctx, name.value, values.map((arg) => arg.value))
                }
            ]
        });

        this.#arrayTools = arrayTools;
    }

    public async set(
        context: BBTagScript,
        variableName: string,
        value: string
    ): Promise<void> {
        const deserializedArray = this.#arrayTools.deserialize(value);
        if (deserializedArray !== undefined) {
            await context.runtime.variables.set(variableName, deserializedArray.v);
        } else {
            await context.runtime.variables.set(variableName, value);
        }
    }

    public async setArray(
        context: BBTagScript,
        variableName: string,
        values: string[]
    ): Promise<void> {
        await context.runtime.variables.set(variableName, values);
    }
}

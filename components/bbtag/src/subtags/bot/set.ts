import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import { tagVariableScopeProviders } from '../../tagVariableScopeProviders.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.set;

@Subtag.names('set')
@Subtag.ctorArgs(Subtag.arrayTools())
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
                    execute: async (ctx, [name]) => await ctx.variables.set(name.value, undefined)
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
        context: BBTagContext,
        variableName: string,
        value: string
    ): Promise<void> {
        const deserializedArray = this.#arrayTools.deserialize(value);
        if (deserializedArray !== undefined) {
            await context.variables.set(variableName, deserializedArray.v);
        } else {
            await context.variables.set(variableName, value);
        }
    }

    public async setArray(
        context: BBTagContext,
        variableName: string,
        values: string[]
    ): Promise<void> {
        await context.variables.set(variableName, values);
    }
}
import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { tagVariableScopeProviders } from '../../tagVariableScopeProviders.js';
import templates from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.set;

export class SetSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'set',
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
    }

    public async set(
        context: BBTagContext,
        variableName: string,
        value: string
    ): Promise<void> {
        const deserializedArray = bbtag.tagArray.deserialize(value);
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

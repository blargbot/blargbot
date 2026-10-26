import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.set;

type Features = VariablesFeature;
export class SetSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
                    execute: async (ctx, [name]) => await features.variables.forContext(ctx).set(name.value, undefined)
                },
                {
                    parameters: ['name', 'value'],
                    description: tag.value.description({ scopes: features.variables.kinds }),
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
        this.#features = features;
    }

    public async set(
        context: BBTagContext,
        variableName: string,
        value: string
    ): Promise<void> {
        const deserializedArray = bbtag.tagArray.deserialize(value);
        if (deserializedArray !== undefined) {
            await this.#features.variables.forContext(context).set(variableName, deserializedArray.v);
        } else {
            await this.#features.variables.forContext(context).set(variableName, value);
        }
    }

    public async setArray(
        context: BBTagContext,
        variableName: string,
        values: string[]
    ): Promise<void> {
        await this.#features.variables.forContext(context).set(variableName, values);
    }
}

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.jsonSet;

type Features = VariablesFeature;
export class JsonSetSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'jsonSet',
            category: SubtagType.JSON,
            aliases: ['jSet'],
            definition: [
                {
                    parameters: ['input:{}', 'path'],
                    description: tag.delete.description,
                    exampleCode: tag.delete.exampleCode,
                    exampleOut: tag.delete.exampleOut,
                    returns: 'json|nothing',
                    execute: (ctx, [input, path]) => this.setValue(ctx, input.value, path.value, undefined, false)
                },
                {
                    parameters: ['input:{}', 'path', 'value'],
                    description: tag.set.description,
                    exampleCode: tag.set.exampleCode,
                    exampleOut: tag.set.exampleOut,
                    returns: 'json|nothing',
                    execute: (ctx, [input, path, value]) => this.setValue(ctx, input.value, path.value, value.value, false)
                },
                {
                    parameters: ['input:{}', 'path', 'value', 'create'],
                    description: tag.create.description,
                    exampleCode: tag.create.exampleCode,
                    exampleOut: tag.create.exampleOut,
                    returns: 'json|nothing',
                    execute: (ctx, [input, path, value]) => this.setValue(ctx, input.value, path.value, value.value, true)
                }
            ]
        });
        this.#features = features;
    }

    public async setValue(
        context: BBTagContext,
        input: string,
        path: string,
        value: string | undefined,
        create: boolean
    ): Promise<JToken | undefined> {
        const variables = this.#features.variables.forContext(context);
        const target = await bbtag.json.resolveObj(variables, input);

        bbtag.json.set(target.object, path, value, create);

        if (target.variable !== undefined) {
            await variables.set(target.variable, target.object);
            return undefined;
        }

        return target.object;
    }
}

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagJsonTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.jsonSet;

@Subtag.id('jsonSet', 'jSet')
@Subtag.factory(Subtag.jsonTools())
export class JsonSetSubtag extends CompiledSubtag {
    readonly #jsonTools: BBTagJsonTools;

    public constructor(jsonTools: BBTagJsonTools) {
        super({
            category: SubtagType.JSON,
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

        this.#jsonTools = jsonTools;
    }

    public async setValue(
        context: BBTagContext,
        input: string,
        path: string,
        value: string | undefined,
        create: boolean
    ): Promise<JToken | undefined> {
        const target = await this.#jsonTools.resolveObj(context, input);

        this.#jsonTools.set(target.object, path, value, create);

        if (target.variable !== undefined) {
            await context.variables.set(target.variable, target.object);
            return undefined;
        }

        return target.object;
    }
}

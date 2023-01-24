import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagJsonTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.jsonClean;

@Subtag.id('jsonClean', 'jClean')
@Subtag.ctorArgs(Subtag.jsonTools())
export class JsonCleanSubtag extends CompiledSubtag {
    readonly #jsonTools: BBTagJsonTools;

    public constructor(jsonTools: BBTagJsonTools) {
        super({
            category: SubtagType.JSON,
            definition: [
                {
                    parameters: ['input:{}'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json',
                    execute: (ctx, [input]) => this.cleanJson(ctx, input.value)
                }
            ]
        });

        this.#jsonTools = jsonTools;
    }

    public async cleanJson(context: BBTagContext, input: string): Promise<JToken> {
        const obj = await this.#jsonTools.resolveObj(context, input);
        return this.#jsonTools.clean(obj.object);
    }
}

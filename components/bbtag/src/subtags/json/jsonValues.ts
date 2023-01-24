import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagJsonTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.jsonValues;

@Subtag.id('jsonValues', 'jValues')
@Subtag.factory(Subtag.jsonTools())
export class JsonValuesSubtag extends CompiledSubtag {
    readonly #jsonTools: BBTagJsonTools;

    public constructor(jsonTools: BBTagJsonTools) {
        super({
            category: SubtagType.JSON,
            definition: [
                {
                    parameters: ['object:{}#10000000', 'path?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json',
                    execute: (ctx, [input, path]) => this.getJsonValue(ctx, input.value, path.value)
                }
            ]
        });

        this.#jsonTools = jsonTools;
    }

    public async getJsonValue(context: BBTagContext, input: string, path: string): Promise<JToken> {
        const obj = (await this.#jsonTools.resolveObj(context, input)).object;

        if (path !== '')
            return Object.values(this.#jsonTools.get(obj, path) ?? {});

        return Object.values(obj);
    }
}

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagJsonTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.jsonKeys;

@Subtag.id('jsonKeys', 'jKeys')
@Subtag.ctorArgs('jsonTools')
export class JsonKeysSubtag extends CompiledSubtag {
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
                    returns: 'string[]',
                    execute: (ctx, [object, path]) => this.getJsonKeys(ctx, object.value, path.value)
                }
            ]
        });

        this.#jsonTools = jsonTools;
    }

    public async getJsonKeys(context: BBTagScript, objStr: string, path: string): Promise<string[]> {
        const obj = (await this.#jsonTools.resolveObj(context.runtime, objStr)).object;

        if (path !== '')
            return Object.keys(this.#jsonTools.get(obj, path) ?? {});

        return Object.keys(obj);
    }
}

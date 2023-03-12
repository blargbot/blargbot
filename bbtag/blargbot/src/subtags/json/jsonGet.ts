import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagJsonTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.jsonGet;

@Subtag.names('jsonGet', 'jGet')
@Subtag.ctorArgs('jsonTools')
export class JsonGetSubtag extends CompiledSubtag {
    readonly #jsonTools: BBTagJsonTools;

    public constructor(jsonTools: BBTagJsonTools) {
        super({
            category: SubtagType.JSON,
            definition: [
                {
                    parameters: ['input:{}#10000000'],
                    description: tag.parse.description,
                    exampleCode: tag.parse.exampleCode,
                    exampleOut: tag.parse.exampleOut,
                    returns: 'json|nothing',
                    execute: (ctx, [input]) => this.jsonGet(ctx, input.value, undefined)
                },
                {
                    parameters: ['input:{}#10000000', 'path'],
                    description: tag.path.description,
                    exampleCode: tag.path.exampleCode,
                    exampleOut: tag.path.exampleOut,
                    returns: 'json|nothing',
                    execute: (ctx, [input, path]) => this.jsonGet(ctx, input.value, path.value)
                }
            ]
        });

        this.#jsonTools = jsonTools;
    }

    public async jsonGet(context: BBTagContext, input: string, path?: string): Promise<JToken | undefined> {
        const obj = (await this.#jsonTools.resolveObj(context, input)).object;
        if (path === undefined)
            return obj;
        return this.#jsonTools.get(obj, path);
    }
}

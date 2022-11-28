import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils/index';

const tag = templates.subtags.jsonGet;

export class JsonGetSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'jsonGet',
            category: SubtagType.JSON,
            aliases: ['jGet'],
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
    }

    public async jsonGet(context: BBTagContext, input: string, path?: string): Promise<JToken | undefined> {
        const obj = (await bbtag.json.resolveObj(context, input)).object;
        if (path === undefined)
            return obj;
        return bbtag.json.get(obj, path);
    }
}

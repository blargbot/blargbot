import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.jsonclean;

export class JsonCleanSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'jsonclean',
            category: SubtagType.JSON,
            aliases: ['jclean'],
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
    }

    public async cleanJson(context: BBTagContext, input: string): Promise<JToken> {
        const obj = await bbtag.json.resolveObj(context, input);
        return bbtag.json.clean(obj.object);
    }
}

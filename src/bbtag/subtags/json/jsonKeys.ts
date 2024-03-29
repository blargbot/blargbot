import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.jsonKeys;

export class JsonKeysSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'jsonKeys',
            category: SubtagType.JSON,
            aliases: ['jKeys'],
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
    }

    public async getJsonKeys(context: BBTagContext, objStr: string, path: string): Promise<string[]> {
        const obj = (await bbtag.json.resolveObj(context, objStr)).object;

        if (path !== '')
            return Object.keys(bbtag.json.get(obj, path) ?? {});

        return Object.keys(obj);
    }
}

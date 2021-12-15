import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class JsonCleanSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'jsonclean',
            category: SubtagType.JSON,
            aliases: ['jclean'],
            definition: [
                {
                    parameters: ['input'],
                    description: 'Using the `input` as a base, cleans up the JSON file structure, parsing stringified nested objects/arrays. Will not mutate the original object.',
                    exampleCode: '{jsonclean;{j;{"test":"[]"}}}',
                    exampleOut: '{"test":[]}',
                    returns: 'json',
                    execute: (ctx, [input]) => this.cleanJson(ctx, input.value)
                }
            ]
        });
    }

    public async cleanJson(context: BBTagContext, input: string): Promise<JToken> {
        const obj = await bbtagUtil.json.parse(context, input);
        return bbtagUtil.json.clean(obj.object);
    }
}

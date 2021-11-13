import { Subtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class JsonCleanSubtag extends Subtag {
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
                    execute: async (context, [{ value: input }]) => {
                        const obj = await bbtagUtil.json.parse(context, input);
                        return JSON.stringify(bbtagUtil.json.clean(obj.object));
                    }
                }
            ]
        });
    }
}

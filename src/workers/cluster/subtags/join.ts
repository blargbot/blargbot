import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class JoinSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'join',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'text'],
                    description: 'Joins the elements of `array` together with `text` as the separator.',
                    exampleCode: '{join;["this", "is", "an", "array"];!}',
                    exampleOut: 'this!is!an!array',
                    execute: async (context, [{ value: inputArray }, { value: text }], subtag) => {
                        const array = await bbtagUtil.tagArray.getArray(context, subtag, inputArray);

                        if (array === undefined || !Array.isArray(array.v))
                            return this.notAnArray(context, subtag);

                        return array.v.join(text);
                    }
                }
            ]
        });
    }
}

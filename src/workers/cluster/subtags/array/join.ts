import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
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
                    execute: (context, [{ value: inputArray }, { value: text }], subtag) => this.join(context, inputArray, text, subtag)
                }
            ]
        });
    }

    public async join(context: BBTagContext, inputArray: string, separator: string, subtag: SubtagCall): Promise<string> {
        const array = await bbtagUtil.tagArray.getArray(context, inputArray);

        if (array === undefined || !Array.isArray(array.v))
            return this.notAnArray(context, subtag);

        return array.v.join(separator);
    }
}

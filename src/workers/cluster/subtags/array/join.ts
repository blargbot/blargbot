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
                    execute: (context, [array, join], subtag) => this.join(context, array.value, join.value, subtag)
                }
            ]
        });
    }

    public async join(context: BBTagContext, arrayStr: string, separator: string, subtag: SubtagCall): Promise<string> {
        const { v: array } = await bbtagUtil.tagArray.getArray(context, arrayStr) ?? {};

        if (array === undefined)
            return this.notAnArray(context, subtag);

        return array.join(separator);
    }
}

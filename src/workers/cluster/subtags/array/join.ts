import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { NotAnArrayError } from '@cluster/bbtag/errors';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class JoinSubtag extends DefinedSubtag {
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
                    returns: 'string',
                    execute: (context, [array, join]) => this.join(context, array.value, join.value)
                }
            ]
        });
    }

    public async join(context: BBTagContext, arrayStr: string, separator: string): Promise<string> {
        const { v: array } = await bbtagUtil.tagArray.getArray(context, arrayStr) ?? {};

        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        return array.join(separator);
    }
}

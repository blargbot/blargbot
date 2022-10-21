import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotAnArrayError } from '../../errors';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.join;

export class JoinSubtag extends CompiledSubtag {
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
        const { v: array } = await bbtag.tagArray.deserializeOrGetArray(context, arrayStr) ?? {};

        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        return array.join(separator);
    }
}

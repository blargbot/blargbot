import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.reverse;

export class ReverseSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'reverse',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [text]) => this.reverse(ctx, text.value)
                }
            ]
        });
    }

    public async reverse(context: BBTagContext, input: string): Promise<string> {
        const arr = bbtag.tagArray.deserialize(input);
        if (arr === undefined)
            return input.split('').reverse().join('');

        arr.v = arr.v.reverse();
        if (arr.n === undefined)
            return bbtag.tagArray.serialize(arr.v);

        await context.variables.set(arr.n, arr.v);
        return '';
    }
}

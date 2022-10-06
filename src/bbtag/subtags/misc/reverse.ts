import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { bbtag, SubtagType } from '../../utils';

export class ReverseSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `reverse`,
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: [`text`],
                    description: `Reverses the order of \`text\`. If \`text\` is an array, the array will be reversed. If \`{get}\` is used with an array, this will modify the original array.`,
                    exampleCode: `{reverse;palindrome}`,
                    exampleOut: `emordnilap`,
                    returns: `string`,
                    execute: (ctx, [text]) => this.reverse(ctx, text.value)
                }
            ]
        });
    }

    public async reverse(context: BBTagContext, input: string): Promise<string> {
        const arr = bbtag.tagArray.deserialize(input);
        if (arr === undefined)
            return input.split(``).reverse().join(``);

        arr.v = arr.v.reverse();
        if (arr.n === undefined)
            return bbtag.tagArray.serialize(arr.v);

        await context.variables.set(arr.n, arr.v);
        return ``;
    }
}

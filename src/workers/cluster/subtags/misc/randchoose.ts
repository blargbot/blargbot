import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { SubtagArgument } from '@cluster/types';
import { bbtagUtil, randChoose, SubtagType } from '@cluster/utils';

export class RandChooseSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'randchoose',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['choiceArray'],
                    description: 'Picks one random entry from `choiceArray`.',
                    exampleCode: 'I feel like eating {randchoose;["pie", "cake", "pudding"]} today',
                    exampleOut: 'I feel like eating pie today',
                    returns: 'json',
                    execute: (ctx, [choice]) => this.randChoose(ctx, choice.value)
                },
                {
                    parameters: ['~choices+2'],
                    description: 'Picks one random entry from `choices`',
                    exampleCode: 'I feel like eating {randchoose;cake;pie;pudding} today',
                    exampleOut: 'I feel like eating pudding today.',
                    returns: 'string',
                    execute: (_, choices) => this.randChooseArg(choices)
                }
            ]
        });
    }

    public async randChooseArg(choices: readonly SubtagArgument[]): Promise<string> {
        return await randChoose(choices).wait();
    }

    public async randChoose(context: BBTagContext, arrayStr: string): Promise<JToken> {
        const choices = await bbtagUtil.tagArray.deserializeOrGetArray(context, arrayStr);
        if (choices === undefined)
            return arrayStr;

        return randChoose(choices.v);
    }
}

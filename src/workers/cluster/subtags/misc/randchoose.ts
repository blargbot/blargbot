import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, parse, randInt, SubtagType } from '@cluster/utils';

export class RandChooseSubtag extends BaseSubtag {
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
                    execute: async (context, [{value: arr}]) => {
                        const choices = await bbtagUtil.tagArray.getArray(context, arr);
                        if (choices === undefined || !Array.isArray(choices.v))
                            return arr;
                        return parse.string(choices.v[randInt(0, choices.v.length - 1)]);
                    }
                },
                {
                    parameters: ['~choices+2'],
                    description: 'Picks one random entry from `choices`',
                    exampleCode: 'I feel like eating {randchoose;cake;pie;pudding} today',
                    exampleOut: 'I feel like eating pudding today.',
                    execute: (_, args) => {
                        const selection = randInt(0, args.length - 1);
                        return args[selection].wait();
                    }
                }
            ]
        });
    }
}

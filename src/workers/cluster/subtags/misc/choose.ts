import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue, SubtagCall } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';

export class ChooseSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'choose',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['choice', '~options+'],
                    description: 'Chooses from the given `options`, where `choice` is the index of the option to select.',
                    exampleCode: 'I feel like eating {choose;1;cake;pie;pudding} today.',
                    exampleOut: 'I feel like eating pie today.',
                    execute: (ctx, args, subtag) => this.choose(ctx, args[0].value, args.slice(1), subtag)
                }
            ]
        });
    }
    public choose(
        context: BBTagContext,
        choice: string,
        options: SubtagArgumentValue[],
        subtag: SubtagCall
    ): Promise<string> | string {
        const index = parse.int(choice);

        if (isNaN(index))
            return this.notANumber(context, subtag);

        if (index < 0)
            return this.customError('Choice cannot be negative', context, subtag);

        if (index >= options.length)
            return this.customError('Index out of range', context, subtag);

        return options[index].wait();
    }
}
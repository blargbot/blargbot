import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext, SubtagCall, parse } from '../core';

export class RandIntSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'randint',
            category: SubtagType.COMPLEX,
            aliases: ['absolute'],
            definition: [
                {
                    parameters: ['min?:0', 'max'],
                    description: 'Chooses a random whole number between `min` and `max` (inclusive). `min` defaults to 0.',
                    exampleCode: 'You rolled a {randint;1;6}.',
                    exampleOut: 'You rolled a 5.',
                    execute: (ctx, args, subtag) => this.randInt(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public randInt(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): string {
        let min = parse.int(args[0]),
            max = parse.int(args[1]);
        const fallback = parse.int(context.scope.fallback ?? '');

        if (isNaN(min)) min = fallback;
        if (isNaN(max)) max = fallback;
        if (isNaN(min))
            return this.notANumber(context, subtag, 'Min is not a number');
        if (isNaN(max))
            return this.notANumber(context, subtag, 'Max is not a number');

        if (min > max)
            [min, max] = [max, min];

        return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
    }
}

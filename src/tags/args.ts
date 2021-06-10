import { Cluster } from '../cluster';
import { BaseSubtag, RuntimeContext, SubtagCall } from '../core/bbtag';
import { SubtagType, parse } from '../utils';

export class ArgsSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'args',
            category: SubtagType.COMPLEX,
            desc:
                'Gets user input. Specifying `index` will only get the word at that location, specifying' +
                '`range` will get all the words between `index` and `range`. Specify `range` as `n` to get all' +
                'the words from `index` to the end',
            usage: '{args;[index];[range]}',
            exampleCode: 'Your second word was {args;1}',
            exampleIn: 'Hello world!',
            exampleOut: 'Your second word was world!',
            definition: {
                whenArgCount: {
                    '1-2': (ctx, args, subtag) =>
                        this.getArgs(
                            ctx,
                            args.map((arg) => arg.value),
                            subtag
                        )
                }
            }
        });
    }

    public getArgs(
        context: RuntimeContext,
        args: string[],
        subtag: SubtagCall
    ): string {
        let from = parse.int(args[0]);
        let to: number;
        const input = context.input;

        if (!args[1]) {
            to = from + 1;
        } else if (args[1] === 'n') {
            to = input.length;
        } else {
            to = parse.int(args[1]);
        }

        if (isNaN(from) || isNaN(to)) return this.notANumber(context, subtag);
        // TODO This behaviour should be documented
        if (from > to) from = [to, (to = from)][0];

        if (!input.hasOwnProperty(from))
            return this.notEnoughArguments(context, subtag);

        return input.slice(from, to).join(' ');
    }
}

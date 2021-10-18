import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';

export class ArgsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'args',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: 'Gets the whole user input',
                    exampleCode: 'You said {args}',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'You said Hello world! BBtag is so cool',
                    execute: (ctx) => this.getAllArgs(ctx)
                },
                {
                    parameters: ['index'],
                    description: 'Gets a word from the user input at the `index` position',
                    exampleCode: '{args;1}',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'world!',
                    execute: (ctx, [index], subtag) => this.getArg(ctx, index.value, subtag)
                },
                {
                    parameters: ['start', 'end'],
                    description: 'Gets all the words in the user input from `start` up to `end`. If `end` is `n` then all words after `start` will be returned',
                    exampleCode: '{args;2;4}',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'BBtag is',
                    execute: (ctx, [start, end], subtag) => this.getArgs(ctx, start.value, end.value, subtag)
                }
            ]
        });
    }

    public getAllArgs(context: BBTagContext): string {
        return context.input.join(' ');
    }

    public getArg(context: BBTagContext, index: string, subtag: SubtagCall): string {
        const i = parse.int(index);
        if (isNaN(i))
            return this.notANumber(context, subtag);

        return context.input[i];
    }

    public getArgs(
        context: BBTagContext,
        start: string,
        end: string,
        subtag: SubtagCall
    ): string {
        let from = parse.int(start);
        let to = end.toLowerCase() === 'n'
            ? context.input.length
            : parse.int(end);

        if (isNaN(from) || isNaN(to))
            return this.notANumber(context, subtag);

        // TODO This behaviour should be documented
        if (from > to)
            from = [to, to = from][0];

        if (context.input.length >= from || from < 0)
            return this.notEnoughArguments(context, subtag);

        return context.input.slice(from, to).join(' ');
    }
}

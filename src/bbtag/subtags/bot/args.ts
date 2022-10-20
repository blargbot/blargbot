import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotANumberError, NotEnoughArgumentsError } from '../../errors';
import { SubtagType } from '../../utils';

export class ArgsSubtag extends CompiledSubtag {
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
                    returns: 'string',
                    execute: (ctx) => this.getAllArgs(ctx)
                },
                {
                    parameters: ['index'],
                    description: 'Gets a word from the user input at the `index` position',
                    exampleCode: '{args;1}',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'world!',
                    returns: 'string',
                    execute: (ctx, [index]) => this.getArg(ctx, index.value)
                },
                {
                    parameters: ['start', 'end'],
                    description: 'Gets all the words in the user input from `start` up to `end`. If `end` is `n` then all words after `start` will be returned',
                    exampleCode: '{args;2;4}',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'BBtag is',
                    returns: 'string',
                    execute: (ctx, [start, end]) => this.getArgs(ctx, start.value, end.value)
                }
            ]
        });
    }

    public getAllArgs(context: BBTagContext): string {
        return context.input.join(' ');
    }

    public getArg(context: BBTagContext, index: string): string {
        const i = parse.int(index);
        if (i === undefined)
            throw new NotANumberError(index);

        if (context.input.length <= i || i < 0)
            throw new NotEnoughArgumentsError(i + 1, context.input.length);

        return context.input[i];
    }

    public getArgs(
        context: BBTagContext,
        start: string,
        end: string
    ): string {
        let from = parse.int(start);
        if (from === undefined)
            throw new NotANumberError(start);

        let to = end.toLowerCase() === 'n'
            ? context.input.length
            : parse.int(end);

        if (to === undefined)
            throw new NotANumberError(end);

        // TODO This behaviour should be documented
        if (from > to)
            from = [to, to = from][0];

        if (context.input.length <= from || from < 0)
            throw new NotEnoughArgumentsError(from + 1, context.input.length);

        return context.input.slice(from, to).join(' ');
    }
}

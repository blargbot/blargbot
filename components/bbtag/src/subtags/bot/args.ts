import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError, NotEnoughArgumentsError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.args;

@Subtag.id('args')
@Subtag.factory(Subtag.converter())
export class ArgsSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.all.description,
                    exampleCode: tag.all.exampleCode,
                    exampleIn: tag.all.exampleIn,
                    exampleOut: tag.all.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getAllArgs(ctx)
                },
                {
                    parameters: ['index'],
                    description: tag.indexed.description,
                    exampleCode: tag.indexed.exampleCode,
                    exampleIn: tag.indexed.exampleIn,
                    exampleOut: tag.indexed.exampleOut,
                    returns: 'string',
                    execute: (ctx, [index]) => this.getArg(ctx, index.value)
                },
                {
                    parameters: ['start', 'end'],
                    description: tag.range.description,
                    exampleCode: tag.range.exampleCode,
                    exampleIn: tag.range.exampleIn,
                    exampleOut: tag.range.exampleOut,
                    returns: 'string',
                    execute: (ctx, [start, end]) => this.getArgs(ctx, start.value, end.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public getAllArgs(context: BBTagContext): string {
        return context.input.join(' ');
    }

    public getArg(context: BBTagContext, index: string): string {
        const i = this.#converter.int(index);
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
        let from = this.#converter.int(start);
        if (from === undefined)
            throw new NotANumberError(start);

        let to = end.toLowerCase() === 'n'
            ? context.input.length
            : this.#converter.int(end);

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

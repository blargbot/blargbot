import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, NotEnoughArgumentsError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.params;

@Subtag.id('params')
@Subtag.ctorArgs(Subtag.converter())
export class ParamsSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.all.description,
                    exampleCode: tag.all.exampleCode,
                    exampleOut: tag.all.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getAllParams(ctx)
                },
                {
                    parameters: ['index'],
                    description: tag.indexed.description,
                    exampleCode: tag.indexed.exampleCode,
                    exampleOut: tag.indexed.exampleOut,
                    returns: 'string',
                    execute: (ctx, [index]) => this.getParam(ctx, index.value)
                },
                {
                    parameters: ['start', 'end'],
                    description: tag.range.description,
                    exampleCode: tag.range.exampleCode,
                    exampleOut: tag.range.exampleOut,
                    returns: 'string',
                    execute: (ctx, [start, end]) => this.getParams(ctx, start.value, end.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public getAllParams(context: BBTagContext): string {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{params} can only be used inside {function}');
        return params.join(' ');
    }

    public getParam(context: BBTagContext, index: string): string {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{params} can only be used inside {function}');

        const i = this.#converter.int(index);
        if (i === undefined)
            throw new NotANumberError(index);

        if (params.length <= i || i < 0)
            throw new NotEnoughArgumentsError(i + 1, params.length);

        return params[i];
    }

    public getParams(
        context: BBTagContext,
        start: string,
        end: string
    ): string {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{params} can only be used inside {function}');

        let from = this.#converter.int(start);
        if (from === undefined)
            throw new NotANumberError(start);

        let to = end.toLowerCase() === 'n'
            ? params.length
            : this.#converter.int(end);

        if (to === undefined)
            throw new NotANumberError(end);

        // TODO This behaviour should be documented
        if (from > to)
            from = [to, to = from][0];

        if (params.length <= from || from < 0)
            throw new NotEnoughArgumentsError(from + 1, params.length);

        return params.slice(from, to).join(' ');
    }
}

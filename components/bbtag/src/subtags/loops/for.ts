import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { AggregateBBTagError, BBTagRuntimeError, InvalidOperatorError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import type { BBTagOperators, OrdinalOperator } from '../../utils/index.js';
import { comparisonOperators, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.for;

@Subtag.id('for')
@Subtag.factory(Subtag.operators(), Subtag.converter())
export class ForSubtag extends CompiledSubtag {
    readonly #operators: BBTagOperators;
    readonly #converter: BBTagValueConverter;

    public constructor(operators: BBTagOperators, converter: BBTagValueConverter) {
        super({
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'initial', 'comparison', 'limit', 'increment?:1', '~code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'loop',
                    execute: (ctx, [variable, initial, operator, limit, increment, code]) => this.for(ctx, variable.value, initial.value, operator.value, limit.value, increment.value, code)
                }
            ]
        });

        this.#operators = operators;
        this.#converter = converter;
    }

    public async * for(
        context: BBTagContext,
        varName: string,
        initialStr: string,
        operator: string,
        limitStr: string,
        incrementStr: string,
        code: SubtagArgument
    ): AsyncIterable<string> {
        const errors = [];
        const initial = this.#converter.float(initialStr) ?? NaN;
        const limit = this.#converter.float(limitStr) ?? NaN;
        const increment = this.#converter.float(incrementStr) ?? NaN;

        if (isNaN(initial)) errors.push(new BBTagRuntimeError('Initial must be a number'));
        if (!comparisonOperators.test(operator)) errors.push(new InvalidOperatorError(operator));
        if (isNaN(limit)) errors.push(new BBTagRuntimeError('Limit must be a number'));
        if (isNaN(increment)) errors.push(new BBTagRuntimeError('Increment must be a number'));
        if (errors.length > 0)
            throw new AggregateBBTagError(errors);

        try {
            for (let i = initial; this.#operators.comparison[operator as OrdinalOperator](i.toString(), limit.toString()); i += increment) {
                await context.limit.check(context, 'for:loops');
                await context.variables.set(varName, i);
                yield await code.execute();

                const varEntry = await context.variables.get(varName);
                i = this.#converter.float(this.#converter.string(varEntry.value)) ?? NaN;

                if (isNaN(i))
                    throw new NotANumberError(varEntry.value);

                if (context.data.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        } finally {
            context.variables.reset([varName]);
        }
    }
}

import { parse } from '@blargbot/core/utils';

import { SubtagArgument } from '../../arguments';
import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { AggregateBBTagError, BBTagRuntimeError, InvalidOperatorError, NotANumberError } from '../../errors';
import templates from '../../text';
import { BBTagRuntimeState } from '../../types';
import { bbtag, OrdinalOperator, SubtagType } from '../../utils';

const tag = templates.subtags.for;

export class ForSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'for',
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
        const initial = parse.float(initialStr) ?? NaN;
        const limit = parse.float(limitStr) ?? NaN;
        const increment = parse.float(incrementStr) ?? NaN;

        if (isNaN(initial)) errors.push(new BBTagRuntimeError('Initial must be a number'));
        if (!bbtag.isComparisonOperator(operator)) errors.push(new InvalidOperatorError(operator));
        if (isNaN(limit)) errors.push(new BBTagRuntimeError('Limit must be a number'));
        if (isNaN(increment)) errors.push(new BBTagRuntimeError('Increment must be a number'));
        if (errors.length > 0)
            throw new AggregateBBTagError(errors);

        try {
            for (let i = initial; bbtag.operate(operator as OrdinalOperator, i.toString(), limit.toString()); i += increment) {
                await context.limit.check(context, 'for:loops');
                await context.variables.set(varName, i);
                yield await code.execute();

                const varEntry = await context.variables.get(varName);
                i = parse.float(parse.string(varEntry.value)) ?? NaN;

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

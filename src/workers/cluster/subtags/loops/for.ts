import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { AggregateBBTagError, BBTagRuntimeError, InvalidOperatorError, NotANumberError } from '@cluster/bbtag/errors';
import { SubtagArgument } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { OrdinalOperator } from '@cluster/utils/bbtag/operators';

export class ForSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'for',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'initial', 'comparison', 'limit', 'increment?:1', '~code'],
                    description: 'To start, `variable` is set to `initial`. Then, the tag will loop, first checking `variable` against `limit` using `comparison`. ' +
                        'If the check succeeds, `code` will be run before `variable` being incremented by `increment` and the cycle repeating.\n' +
                        'This is very useful for repeating an action (or similar action) a set number of times. Edits to `variable` inside `code` will be ignored',
                    exampleCode: '{for;~index;0;<;10;{get;~index},}',
                    exampleOut: '0,1,2,3,4,5,6,7,8,9,',
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
        const initial = parse.float(initialStr);
        const limit = parse.float(limitStr);
        const increment = parse.float(incrementStr);

        if (isNaN(initial)) errors.push(new BBTagRuntimeError('Initial must be a number'));
        if (!bbtagUtil.isComparisonOperator(operator)) errors.push(new InvalidOperatorError(operator));
        if (isNaN(limit)) errors.push(new BBTagRuntimeError('Limit must be a number'));
        if (isNaN(increment)) errors.push(new BBTagRuntimeError('Increment must be a number'));
        if (errors.length > 0)
            throw new AggregateBBTagError(errors);

        try {
            for (let i = initial; bbtagUtil.operate(operator as OrdinalOperator, i.toString(), limit.toString()); i += increment) {
                await context.limit.check(context, 'for:loops');
                await context.variables.set(varName, i);
                yield await code.execute();

                const varValue = await context.variables.get(varName);
                i = parse.float(parse.string(varValue));

                if (isNaN(i))
                    throw new NotANumberError(varValue);

                if (context.state.return !== 0)
                    break;
            }
        } finally {
            await context.variables.reset(varName);
        }
    }
}

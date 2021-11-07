import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { SubtagCall } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const operators = bbtagUtil.operators.numeric;

export class MathSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'math',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['numbers+'],
                    description: 'Accepts multiple `values` and returns the result of `operator` on them. ' +
                        'Valid operators are `' + Object.keys(operators).join('`, `') + '`\n' +
                        'See `{operators}` for a shorter way of performing numeric operations.',
                    exampleCode: '2 + 3 + 6 - 2 = {math;-;{math;+;2;3;6};2}',
                    exampleOut: '2 + 3 + 6 - 2 = 9',
                    execute: (ctx, args, subtag) => this.doMath(ctx, args[0].value, args.slice(1).map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public doMath(
        context: BBTagContext,
        operator: string,
        args: string[],
        subtag: SubtagCall
    ): string {
        if (!bbtagUtil.operators.isNumericOperator(operator))
            return this.customError('Invalid operator', context, subtag, operator + ' is not an operator');

        return bbtagUtil.tagArray.flattenArray(args).map((arg) => {
            if (typeof arg === 'string')
                arg = parse.float(arg);
            if (typeof arg !== 'number' || isNaN(arg))
                throw new NotANumberError(arg);
            return arg;
        }).reduce(operators[operator]).toString();
    }
}

import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const operators = bbtagUtil.operators.numeric;

export class MathSubtag extends Subtag {
    public constructor() {
        super({
            name: 'math',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['operator', 'numbers+'],
                    description: 'Accepts multiple `values` and returns the result of `operator` on them. ' +
                        'Valid operators are `' + Object.keys(operators).join('`, `') + '`\n' +
                        'See `{operators}` for a shorter way of performing numeric operations.',
                    exampleCode: '2 + 3 + 6 - 2 = {math;-;{math;+;2;3;6};2}',
                    exampleOut: '2 + 3 + 6 - 2 = 9',
                    returns: 'number',
                    execute: (_, [operator, ...values]) => this.doMath(operator.value, values.map(arg => arg.value))
                }
            ]
        });
    }

    public doMath(
        operator: string,
        args: string[]
    ): number {
        if (!bbtagUtil.operators.isNumericOperator(operator))
            throw new BBTagRuntimeError('Invalid operator', operator + ' is not an operator');

        return bbtagUtil.tagArray.flattenArray(args).map((arg) => {
            if (typeof arg === 'string')
                arg = parse.float(arg);
            if (typeof arg !== 'number' || isNaN(arg))
                throw new NotANumberError(arg);
            return arg;
        }).reduce(operators[operator]);
    }
}

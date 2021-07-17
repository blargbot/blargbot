import { BaseSubtag, BBTagContext, bbtagUtil, parse, SubtagCall, SubtagType } from '@cluster/core';

const operators = bbtagUtil.operators.compare;

export class BoolSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'bool',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['arg1', 'evaluator', 'arg2'],
                    description:
                        'Evaluates `arg1` and `arg2` using the `evaluator` and returns `true` or `false`. ' +
                        'Valid evaluators are `' + Object.keys(operators).join('`, `') + '`\n' +
                        'The positions of `evaluator` and `arg1` can be swapped.',
                    exampleCode: '{bool;5;<=;10}',
                    exampleOut: 'true',
                    execute: (ctx, args, subtag) => this.runCondition(ctx, subtag, args[0].value, args[1].value, args[2].value)
                }
            ]
        });
    }

    public runCondition(
        context: BBTagContext,
        subtag: SubtagCall,
        left: string,
        evaluator: string,
        right: string
    ): string {
        let operator;
        if (bbtagUtil.operators.isCompareOperator(evaluator)) {
            operator = evaluator;
        } else if (bbtagUtil.operators.isCompareOperator(left)) {
            operator = left;
            [left, operator] = [operator, left];
        } else if (bbtagUtil.operators.isCompareOperator(right)) {
            operator = right;
            [operator, right] = [right, operator];
        } else {
            return this.customError('Invalid operator', context, subtag);
        }

        const leftBool = parse.boolean(left, undefined, false);
        if (leftBool !== undefined) left = leftBool.toString();
        const rightBool = parse.boolean(right, undefined, false);
        if (rightBool !== undefined) right = rightBool.toString();

        return operators[operator](left, right).toString();
    }
}

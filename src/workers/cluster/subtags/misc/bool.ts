import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const operators = bbtagUtil.operators.compare;

export class BoolSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'bool',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['arg1', 'evaluator', 'arg2'],
                    description:
                        'Evaluates `arg1` and `arg2` using the `evaluator` and returns `true` or `false`. ' +
                        'Valid evaluators are `' + Object.keys(operators).join('`, `') + '`\n' +
                        'The positions of `evaluator` and `arg1` can be swapped.',
                    exampleCode: '{bool;5;<=;10}',
                    exampleOut: 'true',
                    execute: (_, args) => this.runCondition(args[0].value, args[1].value, args[2].value)
                }
            ]
        });
    }

    public runCondition(
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
            throw new BBTagRuntimeError('Invalid operator');
        }

        const leftBool = parse.boolean(left, undefined, false);
        if (leftBool !== undefined) left = leftBool.toString();
        const rightBool = parse.boolean(right, undefined, false);
        if (rightBool !== undefined) right = rightBool.toString();

        return operators[operator](left, right).toString();
    }
}

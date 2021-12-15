import { DefinedSubtag } from '@cluster/bbtag';
import { InvalidOperatorError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class BoolSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'bool',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['arg1', 'evaluator', 'arg2'],
                    description:
                        'Evaluates `arg1` and `arg2` using the `evaluator` and returns `true` or `false`. ' +
                        'Valid evaluators are `' + Object.keys(bbtagUtil.comparisonOperators).join('`, `') + '`\n' +
                        'The positions of `evaluator` and `arg1` can be swapped.',
                    exampleCode: '{bool;5;<=;10}',
                    exampleOut: 'true',
                    returns: 'boolean',
                    execute: (_, [arg1, evaluator, arg2]) => this.runCondition(arg1.value, evaluator.value, arg2.value)
                }
            ]
        });
    }

    public runCondition(
        left: string,
        evaluator: string,
        right: string
    ): boolean {
        let operator;
        if (bbtagUtil.isComparisonOperator(evaluator)) {
            operator = evaluator;
        } else if (bbtagUtil.isComparisonOperator(left)) {
            [left, operator] = [evaluator, left];
        } else if (bbtagUtil.isComparisonOperator(right)) {
            [operator, right] = [right, evaluator];
        } else
            throw new InvalidOperatorError(evaluator);

        const leftBool = parse.boolean(left, undefined, false);
        if (leftBool !== undefined)
            left = leftBool.toString();
        const rightBool = parse.boolean(right, undefined, false);
        if (rightBool !== undefined)
            right = rightBool.toString();

        return bbtagUtil.operate(operator, left, right);
    }
}

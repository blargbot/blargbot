import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import { InvalidOperatorError } from '../../errors';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.bool;

export class BoolSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'bool',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['arg1', 'evaluator', 'arg2'],
                    description: tag.default.description({ operators: Object.keys(bbtag.comparisonOperators) }),
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
        if (bbtag.isComparisonOperator(evaluator)) {
            operator = evaluator;
        } else if (bbtag.isComparisonOperator(left)) {
            [left, operator] = [evaluator, left];
        } else if (bbtag.isComparisonOperator(right)) {
            [operator, right] = [right, evaluator];
        } else
            throw new InvalidOperatorError(evaluator);

        const leftBool = parse.boolean(left, undefined, false);
        if (leftBool !== undefined)
            left = leftBool.toString();
        const rightBool = parse.boolean(right, undefined, false);
        if (rightBool !== undefined)
            right = rightBool.toString();

        return bbtag.operate(operator, left, right);
    }
}

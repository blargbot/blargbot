import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType, parse } from '../utils';
import { operatorTypes }  from '../utils/bbtag/operators';
const operators = operatorTypes.compare;


export class BoolSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'bool',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['arg1', 'evaluator', 'arg2'],
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
        operator: string,
        right: string
    ): string {
        if (operators[operator]) {
            //
        } else if (operators[left]) {
            [left, operator, right] = [operator, left, right];
        } else if (operators[right]) {
            [left, operator, right] = [left, right, operator];
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

import { Cluster } from '../cluster';
import { SubtagType, parse, bbtagUtil } from '../utils';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';

const operators = bbtagUtil.operators.numeric;

export class MathSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'math',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['numbers+'],
                    description: 'Accepts multiple `values` and returns the result of `operator` on them. ' +
                        'Valid operators are `' + Object.keys(operators).join('`, `') + '`',
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

        const values = bbtagUtil.tagArray.flattenArray(args);
        const parsedValues = values.map(value => {
            if (value) {
                return parse.float(value.toString());
            } else {
                return NaN;
            }
        });

        if (parsedValues.filter(isNaN).length > 0)
            return this.notANumber(context, subtag, `At index ${parsedValues.findIndex(isNaN)}`);
        return parsedValues.reduce(operators[operator]).toString();
    }
}
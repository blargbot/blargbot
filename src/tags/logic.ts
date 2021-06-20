import { Cluster } from './../cluster/Cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType, parse, bbtagUtil } from '../utils';

const operators = bbtagUtil.operators.logic;

export class LogicSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'logic',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['operator', 'values+'],
                    description: 'Accepts 1 or more boolean `values` (`true` or `false`) and returns the result of `operator` on them. ' +
                        'Valid logic operators are `' + Object.keys(operators).join('`, `') + '`.',
                    exampleCode: '{logic;&&;true;false}',
                    exampleOut: 'false',
                    execute: (ctx, args, subtag) => this.applyLogicOperation(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public applyLogicOperation(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): string {
        let operator;

        for (let i = 0; i < args.length; i++) {
            const operatorName = args[i].toLowerCase();
            if (bbtagUtil.operators.isLogicOperator(operatorName)) {
                operator = operatorName;
                args.splice(i, 1);
            }
        }

        if (!operator)
            return this.customError('Invalid operator', context, subtag);

        const values = args;
        if (operator === '!') {
            const value = parse.boolean(values[0]);
            if (typeof value !== 'boolean')
                return this.notABoolean(context, subtag, values[0] + ' is not a boolean');
            return operators[operator]([value]).toString();
        }
        const parsedValues = values.map((value) => parse.boolean(value));
        const parsedBools = parsedValues.filter((v): v is boolean => typeof v === 'boolean');
        if (parsedBools.length !== parsedValues.length)
            return this.notABoolean(
                context,
                subtag,
                `At index ${parsedValues.findIndex(
                    (v) => typeof v != 'boolean'
                )}`
            );
        return operators[operator](parsedBools).toString();
    }
}
import { Cluster } from './../cluster/Cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType, parse } from '../utils';
import { operatorTypes }  from '../utils/bbtag/operators';
const operators = operatorTypes.logic;

export class LogicSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'logic',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['operator', 'values+'],
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
            if (operators[args[i].toLowerCase()]) {
                operator = args[i].toLowerCase();
                args.splice(i, 1);
            }
        }

        if (!operator)
            return this.customError('Invalid operator', context, subtag);
        const values = args;
        if(operator === '!') {
            const value = parse.boolean(values[0]);
            if (typeof value !== 'boolean')
                return this.notABoolean(context, subtag, values[0] + ' is not a boolean');
            return operators[operator]([value]).toString();
        }
        const parsedValues = values.map((value) => parse.boolean(value));
        if (parsedValues.filter((v) => typeof v === 'undefined').length > 0)
            return this.notABoolean(
                context,
                subtag,
                `At index ${parsedValues.findIndex(
                    (v) => typeof v != 'boolean'
                )}`
            );
        //@ts-ignore complains about parsedValues' type being (boolean | undefined)[] when the above filters that out
        return operators[operator](parsedValues).toString();
    }
}
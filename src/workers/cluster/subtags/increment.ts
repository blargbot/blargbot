import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext, parse, SubtagCall } from '../core';

export class IncrementSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'increment',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['varName'],
                    description: 'Increases `varName`\'s value by `1`. ',
                    exampleCode: '{set;~counter;0} {repeat;{increment;~counter},;10}',
                    exampleOut: '1,2,3,4,5,6,7,8,9,10',
                    execute: (ctx, [{ value }], subtag) => this.increment(ctx, [value], subtag)
                },
                {
                    parameters: ['varName', 'amount:1', 'floor?'],
                    description: 'Increases `varName`\'s value by `amount`. ' +
                        '`floor` is a boolean, and if it is `true` then the value will be rounded down. ' +
                        '`amount` defaults to 1. `floor` defaults to `true`',
                    exampleCode: '{set;~counter;0} {repeat;{increment;~counter;-2},;10}',
                    exampleOut: '2,4,6,8,10,12,14,16,18,20',
                    execute: (ctx, args, subtag) => this.increment(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async increment(context: BBTagContext, args: string[], subtag: SubtagCall): Promise<string> {
        let amount = 1, floor: boolean | undefined = true;

        if (args[1]) amount = parse.float(args[1]);
        if (isNaN(amount))
            return this.notANumber(context, subtag, 'Amount is not a boolean');

        if (args[2]) {
            floor = parse.boolean(args[2]);
            if (typeof floor !== 'boolean')
                return this.notABoolean(context, subtag, 'Floor is not a boolean');
        }

        let value = await context.variables.get(args[0]);
        if (['boolean', 'object', 'undefined'].includes(typeof value))
            return this.notANumber(context, subtag, 'Value is not a number');
        value = parse.float(value as string | number);
        if (isNaN(value))
            return this.notANumber(context, subtag, 'Value is not a number');

        if (floor) value = Math.floor(value), amount = Math.floor(amount);

        value += amount;
        await context.variables.set(args[0], value);

        return value.toString();
    }
}
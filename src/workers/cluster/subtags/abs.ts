import { Cluster } from '../Cluster';
import { BaseSubtag, BBTagContext, bbtagUtil, parse, SubtagCall, SubtagType } from '../core';

export class AbsSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'abs',
            category: SubtagType.COMPLEX,
            aliases: ['absolute'],
            definition: [
                {
                    parameters: ['number'],
                    description: 'Gets the absolute value of `number`',
                    exampleCode: '{abs;-535}',
                    exampleOut: '535',
                    execute: (ctx, [value], subtag) => this.abs(ctx, value.value, subtag)
                },
                {
                    parameters: ['numbers+2'],
                    description: 'Gets the absolute value of each `numbers` and returns an array containing the results',
                    exampleCode: '{abs;-535;123;-42}',
                    exampleOut: '[535, 123, 42]',
                    execute: (ctx, args, subtag) => this.absAll(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public absAll(context: BBTagContext, values: string[], subtag: SubtagCall): string {
        const result = [];
        for (const value of values) {
            const parsed = parse.float(value);
            if (isNaN(parsed))
                return this.notANumber(context, subtag);
            result.push(Math.abs(parsed));
        }
        return bbtagUtil.tagArray.serialize(result);
    }

    public abs(context: BBTagContext, value: string, subtag: SubtagCall): string {
        const val = parse.float(value);
        if (isNaN(val))
            return this.notANumber(context, subtag);
        return Math.abs(val).toString();
    }
}
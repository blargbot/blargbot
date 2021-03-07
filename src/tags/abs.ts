import { Cluster } from '../cluster';
import { BaseSubtag, RuntimeContext, SubtagCall } from '../core/bbtag';
import { bbtagUtil, parse, SubtagType } from '../utils';

export class AbsSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'abs',
            category: SubtagType.COMPLEX,
            aliases: ['absolute'],
            acceptsArrays: true,
            desc: 'Gets the absolute value of `number`. If multiple are supplied, then an array will be returned',
            exampleCode: '{abs;-535}',
            exampleOut: '535',
            definition: {
                whenArgCount: {
                    '1': (ctx, [value], subtag) => this.abs(ctx, value.value, subtag),
                    '>1': (ctx, args, subtag) => this.absAll(ctx, args.map(arg => arg.value), subtag)
                }
            }
        });
    }

    public absAll(context: RuntimeContext, values: string[], subtag: SubtagCall): string {
        const result = [];
        for (const value of values) {
            const parsed = parse.float(value);
            if (isNaN(parsed))
                return this.notANumber(context, subtag);
            result.push(Math.abs(parsed));
        }
        return bbtagUtil.tagArray.serialize(result);
    }

    public abs(context: RuntimeContext, value: string, subtag: SubtagCall): string {
        const val = parse.float(value);
        if (isNaN(val))
            return this.notANumber(context, subtag);
        return Math.abs(val).toString();
    }
}
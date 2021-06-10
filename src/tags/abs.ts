/*
 * @Author: danny-may
 * @Date: 2021-06-10 13:17:57
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-10 13:18:42
 */

import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
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
            usage: '{abs;<number...>}',
            exampleCode: '{abs;-535}',
            exampleOut: '535',
            definition: [
                {
                    args: ['number'],
                    description: 'Gets the absolute value of `number`',
                    execute: (ctx, [value], subtag) => this.abs(ctx, value.value, subtag)
                },
                {
                    args: ['number+'],
                    description: 'Gets the absolute value of each `number` and returns an array containing the results',
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
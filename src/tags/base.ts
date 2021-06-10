import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType, parse, between } from '../utils';

export class BaseNumberSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'base',
            aliases: ['radix'],
            category: SubtagType.COMPLEX,
            desc:
                'Converts a Base `origin` `integer` into a base `radix` number. Default `origin` is 10. `radix` must be between 2 and 36.',
            usage: '{base;<integer>;[origin];<radix>}',
            exampleCode: '{base;255;16}',
            exampleOut: 'FF',
            definition: [
                {
                    args: ['integer', 'radix'],
                    description: 'Converts a Base 10 `integer` into a base `radix` number. Default `origin` is 10. `radix` must be between 2 and 36.',
                    execute: (ctx, [integer, radix], subtag) => this.toBase(ctx, integer.value, '10', radix.value, subtag)
                },
                {
                    args: ['integer', 'origin', 'radix'],
                    description: 'Converts a Base `origin` `integer` into a base `radix` number. Default `origin` is 10. `radix` must be between 2 and 36.',
                    execute: (ctx, [integer, origin, radix], subtag) => this.toBase(ctx, integer.value, origin.value, radix.value, subtag)
                }
            ]
        });
    }

    public toBase(
        context: BBTagContext,
        valueStr: string,
        originStr: string,
        radixStr: string,
        subtag: SubtagCall
    ): string {
        let fallback;
        if (context.scope.fallback)
            fallback = parse.int(context.scope.fallback);

        let origin = parse.int(originStr);
        let radix = parse.int(radixStr);
        const radixFallback =
            fallback !== undefined
                ? !isNaN(fallback) && between(fallback, 2, 36, true)
                : false;
        // @ts-ignore Ignore Type 'number | undefined' is not assignable to type 'number' as fallback has to be a number
        if (isNaN(origin) && radixFallback) origin = fallback;
        // @ts-ignore idem dito
        if (isNaN(radix) && radixFallback) radix = fallback;

        if (isNaN(origin) || isNaN(radix))
            return this.notANumber(context, subtag);

        // @ts-ignore idem dito
        if (!between(origin, 2, 36, true) && radixFallback) origin = fallback;
        // @ts-ignore idem dito
        if (!between(radix, 2, 36, true) && radixFallback) radix = fallback;

        if (!between(origin, 2, 36, true) || !between(radix, 2, 36, true))
            return this.customError(
                'Base must be between 2 and 36',
                context,
                subtag
            );

        let value = parse.int(valueStr, origin);
        if (isNaN(value)) {
            if (fallback && !isNaN(fallback)) {
                value = fallback;
            } else {
                return this.notANumber(context, subtag);
            }
        }
        return value.toString(radix);
    }
}

import { Cluster } from '../cluster';
import { BaseSubtag, RuntimeContext, SubtagCall } from '../core/bbtag';
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
            definition: {
                whenArgCount: {
                    '2-3': (ctx, args, subtag) =>
                        this.toBase(
                            ctx,
                            args.map((arg) => arg.value),
                            subtag
                        )
                }
            }
        });
    }

    public toBase(
        context: RuntimeContext,
        args: string[],
        subtag: SubtagCall
    ): string {
        if (args.length === 2) args.splice(1, 0, '10');

        let fallback;
        if (context.scope.fallback)
            fallback = parse.int(context.scope.fallback);

        let origin = parse.int(args[1]);
        let radix = parse.int(args[2]);
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

        let value = parse.int(args[0], origin);
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

import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType, parse, between } from '../utils';

export class BaseNumberSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'base',
            aliases: ['radix'],
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['integer', 'radix'],
                    description: 'Converts a Base 10 `integer` into a base `radix` number. Default `origin` is 10. `radix` must be between 2 and 36.',
                    exampleCode: '{base;255;16}',
                    exampleOut: 'FF',
                    execute: (ctx, [integer, radix], subtag) => this.toBase(ctx, integer.value, '10', radix.value, subtag)
                },
                {
                    args: ['integer', 'origin', 'radix'],
                    description: 'Converts a Base `origin` `integer` into a base `radix` number. Default `origin` is 10. `radix` must be between 2 and 36.',
                    exampleCode: '{base;FF;16;10}',
                    exampleOut: '255',
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
        if (context.scope.fallback) {
            fallback = parse.int(context.scope.fallback);
            if (isNaN(fallback) || !between(fallback, 2, 36, true))
                fallback = undefined;
        }

        let origin = parse.int(originStr);
        let radix = parse.int(radixStr);

        if (isNaN(origin) && fallback !== undefined) origin = fallback;
        if (isNaN(radix) && fallback !== undefined) radix = fallback;

        if (isNaN(origin) || isNaN(radix))
            return this.notANumber(context, subtag);

        if (!between(origin, 2, 36, true) && fallback !== undefined) origin = fallback;
        if (!between(radix, 2, 36, true) && fallback !== undefined) radix = fallback;

        if (!between(origin, 2, 36, true) || !between(radix, 2, 36, true)) {
            return this.customError(
                'Base must be between 2 and 36',
                context,
                subtag
            );
        }

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

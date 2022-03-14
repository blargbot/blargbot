import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@cluster/bbtag/errors';
import { between, parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class BaseNumberSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'base',
            aliases: ['radix'],
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['integer', 'origin?:10', 'radix'],
                    description: 'Converts `integer` from a base `origin` number into a base `radix` number. `radix` and `origin` must be between 2 and 36.',
                    exampleCode: '{base;FF;16;10}',
                    exampleOut: '255',
                    returns: 'string',
                    execute: (ctx, [integer, origin, radix]) => this.toBase(ctx, integer.value, origin.value, radix.value)
                }
            ]
        });
    }

    public toBase(
        context: BBTagContext,
        valueStr: string,
        originStr: string,
        radixStr: string
    ): string {
        const fallback = new Lazy(() => parse.int(context.scopes.local.fallback ?? '', false));
        let origin = parse.int(originStr, false) ?? fallback.value;
        if (origin === undefined)
            throw new NotANumberError(originStr);

        let radix = parse.int(radixStr, false) ?? fallback.value;
        if (radix === undefined)
            throw new NotANumberError(radixStr);

        if (!between(origin, 2, 36, true) && fallback.value !== undefined) origin = fallback.value;
        if (!between(radix, 2, 36, true) && fallback.value !== undefined) radix = fallback.value;

        if (!between(origin, 2, 36, true) || !between(radix, 2, 36, true))
            throw new BBTagRuntimeError('Base must be between 2 and 36');

        const value = parse.int(valueStr, false, origin) ?? fallback.value;
        if (value === undefined)
            throw new NotANumberError(valueStr);
        return value.toString(radix);
    }
}

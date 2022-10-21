import { Lazy } from '@blargbot/core/Lazy';
import { between, parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, NotANumberError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.base;

export class BaseNumberSubtag extends CompiledSubtag {
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
        const fallback = new Lazy(() => parse.int(context.scopes.local.fallback ?? ''));
        let origin = parse.int(originStr) ?? fallback.value;
        if (origin === undefined)
            throw new NotANumberError(originStr);

        let radix = parse.int(radixStr) ?? fallback.value;
        if (radix === undefined)
            throw new NotANumberError(radixStr);

        if (!between(origin, 2, 36, true) && fallback.value !== undefined) origin = fallback.value;
        if (!between(radix, 2, 36, true) && fallback.value !== undefined) radix = fallback.value;

        if (!between(origin, 2, 36, true) || !between(radix, 2, 36, true))
            throw new BBTagRuntimeError('Base must be between 2 and 36');

        const value = parse.int(valueStr, { radix: origin }) ?? fallback.value;
        if (value === undefined)
            throw new NotANumberError(valueStr);
        return value.toString(radix);
    }
}

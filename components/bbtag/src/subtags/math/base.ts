import { Lazy } from '@blargbot/core/Lazy.js';
import { isBetween } from '@blargbot/guards';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.base;

@Subtag.names('base', 'radix')
@Subtag.ctorArgs(Subtag.converter())
export class BaseNumberSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['integer', 'origin?:10', 'radix'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [integer, origin, radix]) => this.toBase(ctx, integer.value, origin.value, radix.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public toBase(
        context: BBTagContext,
        valueStr: string,
        originStr: string,
        radixStr: string
    ): string {
        const fallback = new Lazy(() => this.#converter.int(context.scopes.local.fallback ?? ''));
        let origin = this.#converter.int(originStr) ?? fallback.value;
        if (origin === undefined)
            throw new NotANumberError(originStr);

        let radix = this.#converter.int(radixStr) ?? fallback.value;
        if (radix === undefined)
            throw new NotANumberError(radixStr);

        if (!isBetween(origin, 2, 36, true) && fallback.value !== undefined) origin = fallback.value;
        if (!isBetween(radix, 2, 36, true) && fallback.value !== undefined) radix = fallback.value;

        if (!isBetween(origin, 2, 36, true) || !isBetween(radix, 2, 36, true))
            throw new BBTagRuntimeError('Base must be between 2 and 36');

        const value = this.#converter.int(valueStr, { radix: origin }) ?? fallback.value;
        if (value === undefined)
            throw new NotANumberError(valueStr);
        return value.toString(radix);
    }
}

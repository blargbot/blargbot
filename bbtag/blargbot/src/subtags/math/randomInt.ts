import { randomInt } from 'node:crypto';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { Lazy } from '../../utils/Lazy.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.randomInt;

@Subtag.id('randomInt', 'randInt')
@Subtag.ctorArgs('converter')
export class RandomIntSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['min?:0', 'max'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [min, max]) => this.randInt(ctx, min.value, max.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public randInt(
        context: BBTagScript,
        minStr: string,
        maxStr: string
    ): number {
        const fallback = new Lazy(() => this.#converter.int(context.runtime.scopes.local.fallback ?? ''));
        let min = this.#converter.int(minStr) ?? fallback.value;
        if (min === undefined)
            throw new NotANumberError(minStr);

        let max = this.#converter.int(maxStr) ?? fallback.value;
        if (max === undefined)
            throw new NotANumberError(maxStr);

        if (min > max)
            [min, max] = [max, min];
        else if (min === max)
            return min;
        return randomInt(min, max);
    }
}

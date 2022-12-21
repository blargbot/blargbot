import { Lazy } from '@blargbot/core/Lazy.js';
import { parse, randInt } from '@blargbot/core/utils/index.js';

import { NotANumberError } from '../../errors/index.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class RandomIntSubtag extends Subtag {
    public constructor() {
        super({
            name: 'randomInt',
            aliases: ['randInt'],
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
    }

    public randInt(
        context: BBTagContext,
        minStr: string,
        maxStr: string
    ): number {
        const fallback = new Lazy(() => parse.int(context.scopes.local.fallback ?? ''));
        const min = parse.int(minStr) ?? fallback.value;
        if (min === undefined)
            throw new NotANumberError(minStr);

        const max = parse.int(maxStr) ?? fallback.value;
        if (max === undefined)
            throw new NotANumberError(maxStr);

        return randInt(min, max);
    }
}

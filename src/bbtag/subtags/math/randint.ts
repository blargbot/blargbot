import { Lazy } from '@blargbot/core/Lazy';
import { parse, randInt } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotANumberError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.randint;

export class RandIntSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'randint',
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

import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class RandIntSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'randint',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['min?:0', 'max'],
                    description: 'Chooses a random whole number between `min` and `max` (inclusive). `min` defaults to 0.',
                    exampleCode: 'You rolled a {randint;1;6}.',
                    exampleOut: 'You rolled a 5.',
                    execute: (ctx, [min, max]) => this.randInt(ctx, min.value, max.value)
                }
            ]
        });
    }

    public randInt(
        context: BBTagContext,
        minStr: string,
        maxStr: string
    ): string {
        const fallback = new Lazy(() => parse.int(context.scopes.local.fallback ?? '', false));
        const min = parse.int(minStr, false) ?? fallback.value;
        if (min === undefined)
            throw new NotANumberError(minStr);

        const max = parse.int(maxStr, false) ?? fallback.value;
        if (max === undefined)
            throw new NotANumberError(maxStr);

        return (Math.floor(Math.random() * (Math.abs(max - min) + 1)) + min).toString();
    }
}

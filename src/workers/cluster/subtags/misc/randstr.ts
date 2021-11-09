import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class RandStrSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'randstr',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['chars', 'length'],
                    description: 'Creates a random string with characters from `chars` that is `length` characters long.',
                    exampleCode: '{randstr;abcdefghijklmnopqrstuvwxyz;9}',
                    exampleOut: 'kgzyqcvda',
                    execute: (ctx, [{ value: charsStr }, { value: countStr }]) => this.randStr(ctx, charsStr, countStr)
                }
            ]
        });
    }

    public randStr(
        context: BBTagContext,
        charsStr: string,
        countStr: string
    ): string {
        const chars = charsStr.split('');
        const count = parse.int(countStr, false) ?? parse.int(context.scopes.local.fallback ?? '', false);
        if (count === undefined)
            throw new NotANumberError(countStr);

        if (chars.length === 0)
            throw new BBTagRuntimeError('Not enough characters');

        const numberArray = [...Array(count).keys()];
        return numberArray.map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
}

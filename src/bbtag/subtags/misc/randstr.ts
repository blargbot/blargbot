import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, NotANumberError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.randstr;

export class RandStrSubtag extends CompiledSubtag {
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
                    returns: 'string',
                    execute: (ctx, [chars, count]) => this.randStr(ctx, chars.value, count.value)
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
        const count = parse.int(countStr) ?? parse.int(context.scopes.local.fallback ?? '');
        if (count === undefined)
            throw new NotANumberError(countStr);

        if (chars.length === 0)
            throw new BBTagRuntimeError('Not enough characters');

        const numberArray = [...Array(count).keys()]; // TODO: count should be limited here
        return numberArray.map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
}

import { parse } from '@blargbot/core/utils/index.js';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.randomString;

export class RandomStringSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'randomString',
            aliases: ['randStr', 'randString'],
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['chars', 'length'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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

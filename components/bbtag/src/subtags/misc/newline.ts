import { parse } from '@blargbot/core/utils/index.js';

import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.newline;

export class NewlineSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'newline',
            category: SubtagType.MISC,
            aliases: ['n'],
            definition: [
                {
                    parameters: ['count?:1'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [count]) => this.getNewlines(ctx, count.value)
                }
            ]
        });
    }

    public getNewlines(ctx: BBTagContext, countStr: string): string {
        const count = parse.int(countStr) ?? parse.int(ctx.scopes.local.fallback ?? '');
        if (count === undefined)
            throw new NotANumberError(countStr);

        // TODO: limit count
        return ''.padStart(count < 0 ? 0 : count, '\n');
    }
}

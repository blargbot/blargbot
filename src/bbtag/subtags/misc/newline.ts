import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotANumberError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

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
                    description: 'Will be replaced by `count` newline characters (\\n).',
                    exampleCode: 'Hello,{newline}world!',
                    exampleOut: 'Hello,\nworld!',
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

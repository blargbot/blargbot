import { BaseSubtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class NewlineSubtag extends BaseSubtag {
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
                    execute: (context, [{ value: countStr }]) => {
                        const count = parse.int(countStr, false) ?? parse.int(context.scopes.local.fallback ?? '', false);
                        if (count === undefined)
                            throw new NotANumberError(countStr);
                        return ''.padStart(count < 0 ? 0 : count, '\n');
                    }
                }
            ]
        });
    }
}

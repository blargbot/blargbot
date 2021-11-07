import { BaseSubtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class SpaceSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'space',
            category: SubtagType.MISC,
            aliases: ['s'],
            definition: [
                {
                    parameters: ['count?:1'],
                    description: 'Will be replaced by `count` spaces. If `count` is less than `0`, no spaces will be returned.',
                    exampleCode: 'Hello,{space;4}world!',
                    exampleOut: 'Hello,    world!',
                    execute: (ctx, [countStr]) => {
                        const count = parse.int(countStr.value, false) ?? parse.int(ctx.scopes.local.fallback ?? '', false);
                        if (count === undefined)
                            throw new NotANumberError(countStr.value);

                        return ''.padStart(count < 0 ? 0 : count, ' ');
                    }
                }
            ]
        });
    }
}

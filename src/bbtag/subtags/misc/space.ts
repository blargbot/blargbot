import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { NotANumberError } from '../../errors';
import { SubtagType } from '../../utils';

export class SpaceSubtag extends DefinedSubtag {
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
                    returns: 'string',
                    execute: (ctx, [count]) => this.getSpaces(ctx, count.value)
                }
            ]
        });
    }

    public getSpaces(ctx: BBTagContext, countStr: string): string {
        const count = parse.int(countStr, false) ?? parse.int(ctx.scopes.local.fallback ?? '', false);
        if (count === undefined)
            throw new NotANumberError(countStr);

        // TODO: limit count
        return ''.padStart(count < 0 ? 0 : count, ' ');
    }
}

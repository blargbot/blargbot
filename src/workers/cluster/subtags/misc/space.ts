import { BaseSubtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class SpaceSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'space',
            category: SubtagType.COMPLEX,
            aliases: ['s'],
            definition: [
                {
                    parameters: ['count?:1'],
                    description: 'Will be replaced by `count` spaces. If `count` is less than `0`, no spaces will be returned.',
                    exampleCode: 'Hello,{space;4}world!',
                    exampleOut: 'Hello,    world!',
                    execute: (ctx, [countStr], subtag) => {
                        let count = parse.int(countStr.value);
                        const fallback = parse.int(ctx.scope.fallback ?? '');
                        if (isNaN(count)) {
                            if (isNaN(fallback))
                                return this.notANumber(ctx, subtag, 'Count and fallback are not numbers');
                            count = fallback;
                        }
                        if (count < 0) count = 0;

                        return ''.padStart(count, ' ');
                    }
                }
            ]
        });
    }
}

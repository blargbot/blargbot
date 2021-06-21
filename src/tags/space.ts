import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType, parse } from '../utils';

export class SpaceSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'space',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['count?:1'],
                    description: 'Will be replaced by `count` spaces. If `count` is less than `0`, no spaces will be returned.',
                    exampleCode: 'Hello,{space;4}world!',
                    exampleOut: 'Hello,    world!',
                    execute: (ctx, args, subtag) => {
                        let count = parse.int(args[0]?.value || 1);
                        const fallback = parse.int(ctx.scope.fallback || '');
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
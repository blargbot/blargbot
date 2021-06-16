import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class FallBackSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'fallback',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['message?'],
                    description: 'Should any tag fail to parse, it will be replaced with `message` instead of an error.',
                    exampleCode: '{fallback;This tag failed} {randint}',
                    exampleOut: 'This tag failed',
                    execute: (ctx, args) => (ctx.scope.fallback = args[0]?.value) && ''
                }
            ]
        });
    }
}
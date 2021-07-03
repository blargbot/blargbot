import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

export class FallBackSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'fallback',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['message?'],
                    description: 'Should any tag fail to parse, it will be replaced with `message` instead of an error.',
                    exampleCode: '{fallback;This tag failed} {randint}',
                    exampleOut: 'This tag failed',
                    execute: (ctx, [message]) => { ctx.scope.fallback = message.value; }
                }
            ]
        });
    }
}

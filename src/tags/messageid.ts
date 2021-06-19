import { Cluster } from '../cluster';
import { SubtagType } from '../utils';
import { BaseSubtag } from '../core/bbtag';

export class MessageIdSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'messageid',
            category: SubtagType.API,
            desc: 'Returns the ID of the invoking message.',
            definition: [
                {
                    args: [],
                    exampleCode: 'The message id was {messageid}',
                    exampleOut: 'The message id was 111111111111111111',
                    execute: (ctx) => ctx.message.id
                }
            ]
        });
    }
}
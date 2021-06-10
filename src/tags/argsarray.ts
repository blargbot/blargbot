import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class ArgsarraySubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'argsarray',
            category: SubtagType.SIMPLE,
            desc: 'Gets user input as an array.',
            usage: '{argsarray}',
            exampleCode: 'Your input was {argsarray}',
            exampleIn: 'Hello world!',
            exampleOut: 'Your input was ["Hello","world!"]',
            definition: [
                {
                    args: [],
                    description: 'Return the number of arguments the user provided.',
                    execute: (ctx) => JSON.stringify(ctx.input)
                }
            ]
        });
    }
}

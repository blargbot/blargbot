import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class Argslength extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'argslength',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: 'Return the number of arguments the user provided.',
                    exampleCode: 'You said {argslength} words.',
                    exampleIn: 'I am saying things.',
                    exampleOut: 'You said 4 words.',
                    execute: (ctx) => ctx.input.length.toString()
                }
            ]
        });
    }
}

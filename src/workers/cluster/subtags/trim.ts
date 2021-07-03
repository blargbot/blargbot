import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

export class TrimSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'trim',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Trims whitespace and newlines before and after `text`.',
                    exampleCode: 'Hello {trim;{space;10}beautiful{space;10}} World',
                    exampleOut: 'Hello beautiful World',
                    execute: (_, [{ value: text }]) => text.trim()
                }
            ]
        });
    }
}

import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

export class SemiSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'semi',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: 'Returns `;`',
                    exampleCode: 'This is a semicolon! {semi}',
                    exampleOut: 'This is a semicolon! ;',
                    execute: () => ';'
                }
            ]
        });
    }
}

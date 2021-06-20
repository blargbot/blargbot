import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

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
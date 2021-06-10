import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class VoidSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'void',
            category: SubtagType.COMPLEX,
            desc: 'Executes `code` but does not return the output from it. Useful for silent functionality',
            usage: '{void;[code]}',
            exampleCode: '{void;This won\'t be output!}',
            exampleOut: '',
            definition: [
                {
                    args: ['code?'],
                    description: 'Silently executes `code`',
                    execute: () => ''
                }
            ]
        });
    }
}
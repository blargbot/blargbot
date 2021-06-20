import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class IsccSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'iscc',
            category: SubtagType.SIMPLE,
            desc: 'Checks if the tag is being run from within a cc. Returns a boolean (`true` or `false`)',
            definition: [
                {
                    parameters: [],
                    exampleCode: '{if;{iscc};{dm;{userid};You have mail!};Boo, this only works in cc\'s}',
                    exampleOut: 'Boo, this only works in cc\'s',
                    execute: (ctx) => (ctx.isCC === true).toString()
                }
            ]
        });
    }
}
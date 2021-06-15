import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';
import md5 from 'md5';

export class Md5Subtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'md5',
            aliases: ['md5encode'],
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['text'],
                    description: 'Converts the provided text to md5.',
                    exampleCode: '{md5;Woosh whap phew!}',
                    exampleOut: '71d97a11f770a34d7f8cf1f1d8749d85',
                    execute: (_, [{value: text}]) => md5(text)
                }
            ]
        });
    }
}

import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class CommentSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'comment',
            aliases: ['//'],
            category: SubtagType.COMPLEX,
            desc: 'A subtag that just gets removed. Useful for documenting your code.',
            definition: [
                {
                    parameters: ['~anything*'],
                    exampleCode: 'This is a sentence. {//;This is a comment.}',
                    exampleOut: 'This is a sentence.',
                    execute: () => ''
                }
            ]
        });
    }
}
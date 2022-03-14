import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { SubtagType } from '@blargbot/cluster/utils';

export class CommentSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'comment',
            aliases: ['//'],
            category: SubtagType.MISC,
            desc: 'A subtag that just gets removed. Useful for documenting your code.',
            definition: [
                {
                    parameters: ['~anything*'],
                    exampleCode: 'This is a sentence. {//;This is a comment.}',
                    exampleOut: 'This is a sentence.',
                    returns: 'nothing',
                    execute: () => this.doNothing()
                }
            ]
        });
    }

    public doNothing(): void {
        /*NOOP*/
    }
}

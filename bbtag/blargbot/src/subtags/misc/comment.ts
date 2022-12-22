import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class CommentSubtag extends Subtag {
    public constructor() {
        super({
            name: 'comment',
            aliases: ['//'],
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['~anything*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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

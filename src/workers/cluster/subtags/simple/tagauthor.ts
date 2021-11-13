import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class TagAuthorSubtag extends Subtag {
    public constructor() {
        super({
            name: 'tagauthor',
            category: SubtagType.SIMPLE,
            aliases: ['ccauthor'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns the user ID of the tag/cc author',
                    exampleCode: 'This tag was created by {username;{tagauthor}}',
                    exampleOut: 'This tag was created by stupid cat',
                    returns: 'id',
                    execute: (ctx) => ctx.author
                }
            ]
        });
    }
}

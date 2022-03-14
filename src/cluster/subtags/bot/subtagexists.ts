import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { SubtagType } from '@blargbot/cluster/utils';

export class SubtagExistsSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'subtagexists',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['subtag'],
                    description: 'Checks to see if `subtag` exists.',
                    exampleIn: '{subtagexists;ban} {subtagexists;AllenKey}',
                    exampleOut: 'true false',
                    returns: 'boolean',
                    execute: (ctx, [subtag]) => ctx.subtags.get(subtag.value) !== undefined
                }
            ]
        });
    }
}

import { Subtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class QuietSubtag extends Subtag {
    public constructor() {
        super({
            name: 'quiet',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['isQuiet?:true'],
                    description: 'Tells any subtags that rely on a `quiet` field to be/not be quiet based on `isQuiet. `isQuiet` must be a boolean',
                    exampleCode: '{quiet} {usermention;cat}',
                    exampleOut: 'cat',
                    returns: 'nothing',
                    execute: (ctx, [quiet]) => {
                        ctx.scopes.local.quiet = parse.boolean(quiet.value);
                    }
                }
            ]
        });
    }
}

import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { parse, SubtagType } from '@blargbot/cluster/utils';

export class QuietSubtag extends DefinedSubtag {
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
                    execute: (ctx, [quiet]) => this.setQuiet(ctx, quiet.value)
                }
            ]
        });
    }

    public setQuiet(context: BBTagContext, valueStr: string): void {
        context.scopes.local.quiet = parse.boolean(valueStr);
    }
}

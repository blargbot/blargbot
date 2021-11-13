import { BBTagContext, Subtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class EveryoneMentionSubtag extends Subtag {
    public constructor() {
        super({
            name: 'everyonemention',
            aliases: ['everyone'],
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['mention?'],
                    description: 'Returns the mention of `@everyone`.\nThis requires the `disableeveryone` setting to be false. If `mention` is set to `true`, `@everyone` will ping, else it will be silent.',
                    exampleCode: '{everyonemention}',
                    exampleOut: '@everyone',
                    returns: 'string',
                    execute: (ctx, args) => this.everyoneMention(ctx, args[0].value)
                }
            ]
        });
    }

    public everyoneMention(
        context: BBTagContext,
        mention: string
    ): string {
        const enabled = parse.boolean(mention, true);
        context.state.allowedMentions.everybody = enabled;

        return '@everyone';
    }
}

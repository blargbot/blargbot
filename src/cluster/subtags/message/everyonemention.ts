import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { parse, SubtagType } from '@blargbot/cluster/utils';

export class EveryoneMentionSubtag extends DefinedSubtag {
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
                    execute: (ctx, [mention]) => this.everyoneMention(ctx, mention.value)
                }
            ]
        });
    }

    public everyoneMention(
        context: BBTagContext,
        mention: string
    ): string {
        const enabled = parse.boolean(mention, true);
        context.data.allowedMentions.everybody = enabled;

        return '@everyone';
    }
}

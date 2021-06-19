import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext } from '../core/bbtag';
import { SubtagType, parse } from '../utils';

export class EveryoneMentionSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'everyonemention',
            aliases: ['everyone'],
            category: SubtagType.API,
            definition: [
                {
                    args: ['mention?'],
                    description: 'Returns the mention of `@everyone`.\nThis requires the `disableeveryone` setting to be false. If `mention` is set to `true`, `@everyone` will ping, else it will be silent.',
                    exampleCode: '{everyonemention}',
                    exampleOut: '@everyone',
                    execute: (ctx, args) => this.everyoneMention(ctx, args[0]?.value)
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
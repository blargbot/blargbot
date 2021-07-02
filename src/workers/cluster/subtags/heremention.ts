import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext, parse } from '../core';

export class HereMentionSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'heremention',
            aliases: ['here'],
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['mention?'],
                    description: 'Returns the mention of `@here`.\nThis requires the `disableeveryone` setting to be false. If `mention` is set to `true`, `@here` will ping, else it will be silent.',
                    exampleCode: '{heremention}',
                    exampleOut: '@here',
                    execute: (ctx, args) => this.hereMention(ctx, args[0]?.value)
                }
            ]
        });
    }

    public hereMention(
        context: BBTagContext,
        mention: string
    ): string {
        const enabled = parse.boolean(mention, true);
        context.state.allowedMentions.everybody = enabled;

        return '@here';
    }
}
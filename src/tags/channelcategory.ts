import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType } from '../utils';

export class ChannelCategorySubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channelcategory',
            aliases: ['category'],
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the category ID of the current channel.',
                    exampleCode: '{channelcategory}',
                    exampleOut: '111111111111111',
                    execute: (ctx) => ctx.channel.id
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the category ID of the provided `channel`. If the provided `channel` is a category this returns nothing. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channelcategory;cool channel}\n{channelcategory;cool category}',
                    exampleOut: '111111111111111\n(nothing is returned here)',
                    execute: (ctx, args, subtag) => this.getCategory(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async getCategory(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.getChannel(args[0]);
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        if (!channel)
            return quiet ? '' : this.channelNotFound(context, subtag, `${args[0]} could not be found`);
        return channel.parentID || '';
    }
}
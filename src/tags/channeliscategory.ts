import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType } from '../utils';

export class ChannelIsCategorySubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channeliscategory',
            aliases: ['iscategory'],
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a category. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{channeliscategory;cool category}\n{channeliscategory;category that doesn\'t exist}',
                    exampleOut: 'true\n(nothing is returned here)',
                    execute: (ctx, args, subtag) => this.isCategory(ctx, args.map(arg => arg.value), subtag)

                }
            ]
        });
    }

    public async isCategory(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.getChannel(args[0]);
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        if (!channel)
            return quiet ? 'false' : this.channelNotFound(context, subtag, `${args[0]} could not be found`);
        return (channel.type === 4).toString();
    }
}
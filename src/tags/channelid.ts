import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall} from '../core/bbtag';
import { SubtagType } from '../utils';

export class ChannelIdSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channelid',
            aliases: ['categoryid'],
            category: SubtagType.API,
            definition: [
                {
                    args: [],
                    description: 'Returns the ID of the current channel.',
                    exampleCode: '{channelid}',
                    exampleOut: '111111111111111',
                    execute: (ctx) => ctx.channel.id
                },
                {
                    args: ['channel', 'quiet?'],
                    description: 'Returns the ID of the given channel. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channelid;cool channel}\n{channelid;some channel that doesn\'t exist;true}',
                    exampleOut: '111111111111111\n(nothing is returned here)',
                    execute: (ctx, args, subtag) => this.getChannelID(ctx, args.map(arg => arg.value), subtag)

                }
            ]
        });
    }

    public async getChannelID(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.getChannel(args[0]);
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        if (!channel)
            return quiet ? '' : this.channelNotFound(context, subtag, `${args[0]} could not be found`);
        return channel.id;
    }
}
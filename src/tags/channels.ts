import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall} from '../core/bbtag';
import { SubtagType } from '../utils';

export class ChannelsSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channels',
            category: SubtagType.API,
            definition: [
                {
                    args: [],
                    description: 'Returns an array of channel IDs in the current guild',
                    exampleCode: 'This guild has {length;{channels}} channels.',
                    exampleOut: 'This guild has {length;{channels}} channels.',
                    execute: (ctx) => JSON.stringify(ctx.guild.channels.map(c => c.id))
                },
                {
                    args: ['category', 'quiet?'],
                    description: 'Returns an array of channel IDs in within the given `category`. If `category` is not a category, returns an empty array. If `category` cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'Category cat-channels has {length;{channels;cat-channels}} channels.',
                    exampleOut: 'Category cat-channels has 6 channels.',
                    execute: (ctx, args, subtag) => this.getChannelsInCategory(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async getChannelsInCategory(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.getChannel(args[0]);
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        if (!channel)
            return quiet ? '' : this.channelNotFound(context, subtag, `${args[0]} could not be found`);
        if (channel.type !== 4)
            return '[]';
        return JSON.stringify(channel.channels ? channel.channels.map(c => c.id) : []);
    }
}
